from flask import Flask, request, jsonify
import torch
import torchvision.transforms as transforms
from PIL import Image
import io
import torch.nn as nn
import pennylane as qml
import os
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Define constants (should match the model configuration)
n_qubits = 4
n_layers = 2
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Configure model paths
MODEL_PATHS = {
    'resnet': './models/hybrid_resnet_model.pth',
    'vgg': './models/hybrid_vgg_model.pth',
    'mobilenet': './models/hybrid_mobilenet_model.pth',
    'inception': './models/hybrid_inception_model.pth'
}

# Class labels
CLASSES = [ 'Meningioma','Glioma', 'Pituitary']

# Set up the quantum device
dev = qml.device("default.qubit", wires=n_qubits)

# Define the quantum circuit
@qml.qnode(dev, interface="torch")
def quantum_circuit(inputs, weights):
    # Encode the classical data into quantum states
    for i in range(n_qubits):
        qml.RY(inputs[i], wires=i)

    # Quantum layers
    for l in range(n_layers):
        for i in range(n_qubits):
            qml.RZ(weights[l][i][0], wires=i)
            qml.RY(weights[l][i][1], wires=i)

        # Entangling layers
        for i in range(n_qubits-1):
            qml.CNOT(wires=[i, i+1])
        qml.CNOT(wires=[n_qubits-1, 0])

    # Measure all qubits
    return [qml.expval(qml.PauliZ(i)) for i in range(n_qubits)]

class QuantumLayer(nn.Module):
    def __init__(self):
        super().__init__()
        weight_shapes = {"weights": (n_layers, n_qubits, 2)}
        self.qlayer = qml.qnn.TorchLayer(quantum_circuit, weight_shapes)

    def forward(self, x):
        batch_size = x.shape[0]
        # Process each sample in the batch separately
        outputs = []
        for i in range(batch_size):
            sample = x[i].reshape(n_qubits)
            output = self.qlayer(sample)
            outputs.append(output)
        return torch.stack(outputs)

# Base class for all hybrid models
class BaseHybridModel(nn.Module):
    def __init__(self, backbone, feature_size, num_classes=3):
        super().__init__()
        self.backbone = backbone

        # Add quantum layer with proper feature reduction
        self.feature_reducer = nn.Sequential(
            nn.Linear(feature_size, 16),
            nn.ReLU(),
            nn.Linear(16, n_qubits)
        )
        self.quantum_layer = QuantumLayer()

        # Final classification layer
        self.classifier = nn.Linear(n_qubits, num_classes)

    def forward(self, x):
        # Classical features from backbone
        features = self.backbone(x)

        # Reduce features for quantum processing
        reduced_features = self.feature_reducer(features)

        # Quantum processing
        quantum_out = self.quantum_layer(reduced_features)

        # Final classification
        return self.classifier(quantum_out)

# Model factory function
def get_model(model_type):
    if model_type == 'resnet':
        from torchvision.models import resnet18
        backbone = resnet18(pretrained=False)
        feature_size = backbone.fc.in_features
        backbone.fc = nn.Identity()
        
        model = BaseHybridModel(backbone, feature_size)
    
    elif model_type == 'vgg':
        from torchvision.models import vgg16
        backbone = vgg16(pretrained=False)
        feature_size = backbone.classifier[6].in_features
        backbone.classifier[6] = nn.Identity()
        
        model = BaseHybridModel(backbone, feature_size)
    
    elif model_type == 'mobilenet':
        from torchvision.models import mobilenet_v2
        backbone = mobilenet_v2(pretrained=False)
        feature_size = backbone.classifier[1].in_features
        backbone.classifier[1] = nn.Identity()
        
        model = BaseHybridModel(backbone, feature_size)
    
    elif model_type == 'inception':
        from torchvision.models import inception_v3
        backbone = inception_v3(pretrained=False, aux_logits=False)
        feature_size = backbone.fc.in_features
        backbone.fc = nn.Identity()
        
        model = BaseHybridModel(backbone, feature_size)
    
    else:
        raise ValueError(f"Unsupported model type: {model_type}")
    
    return model

# Image preprocessing function
def preprocess_image(image_bytes, model_type):
    # Open the image
    image = Image.open(io.BytesIO(image_bytes))
    
    # Determine image size based on model type
    if model_type == 'inception':
        image_size = 299  # Inception requires 299x299
    else:
        image_size = 224  # Standard size for other models
    
    # Define transforms
    transform = transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406],
                          std=[0.229, 0.224, 0.225])
    ])
    
    # Apply transforms
    image_tensor = transform(image).unsqueeze(0)  # Add batch dimension
    return image_tensor

# API endpoint for classification
@app.route('/classify', methods=['POST'])
def classify_image():
    # Check if the post request has the file part
    if 'image' not in request.files:
        return jsonify({'error': 'No image provided'}), 400
    
    # Get the model type
    model_type = request.form.get('model_type', 'resnet')
    if model_type not in MODEL_PATHS:
        return jsonify({'error': f'Invalid model type: {model_type}'}), 400
    
    try:
        # Get image file
        image_file = request.files['image']
        image_bytes = image_file.read()
        
        # Preprocess the image
        image_tensor = preprocess_image(image_bytes, model_type)
        
        # Load the model
        model = get_model(model_type)
        
        # Check if model file exists
        if not os.path.exists(MODEL_PATHS[model_type]):
            return jsonify({'error': f'Model file not found: {MODEL_PATHS[model_type]}'}), 404
            
        # Load model weights
        model.load_state_dict(torch.load(MODEL_PATHS[model_type], map_location=DEVICE))
        model.eval()
        
        # Move tensor to device
        image_tensor = image_tensor.to(DEVICE)
        
        # Make prediction
        with torch.no_grad():
            outputs = model(image_tensor)
            probabilities = torch.nn.functional.softmax(outputs, dim=1)[0]
            
            # Get the predicted class and confidence
            pred_class = torch.argmax(probabilities).item()
            confidences = [float(prob) * 100 for prob in probabilities]
            
        # Return results
        result = {
            'prediction': {
                'class_id': pred_class,
                'class_name': CLASSES[pred_class],
                'confidence': confidences[pred_class]
            },
            'confidences': {
                CLASSES[i]: confidences[i] for i in range(len(CLASSES))
            }
        }
        
        return jsonify(result)
    
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    # Create models directory if it doesn't exist
    os.makedirs('./models', exist_ok=True)
    
    print(f"Running on device: {DEVICE}")
    print("Available models:")
    for model_type, path in MODEL_PATHS.items():
        status = "✅ Found" if os.path.exists(path) else "❌ Not Found"
        print(f"  - {model_type}: {path} {status}")
    
    print("\nStarting server on port 8080...")
    app.run(debug=True, host='0.0.0.0', port=8080)