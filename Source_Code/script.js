// // DOM Elements
// const modelSelect = document.getElementById('model-select');
// const imageUpload = document.getElementById('image-upload');
// const imagePreview = document.getElementById('image-preview');
// const previewContainer = document.getElementById('preview-container');
// const classifyBtn = document.getElementById('classify-btn');
// const resultsContainer = document.getElementById('results-container');
// const loadingElement = document.querySelector('.loading');
// const modelArchitecture = document.getElementById('model-architecture');
// const modelAccuracy = document.getElementById('model-accuracy');
// const logWindow = document.querySelector('.log-window');

// // API endpoint (adjust as needed based on your server setup)
// const API_URL = 'http://localhost:8080/classify';

// // Chart instance
// let resultsChart = null;

// // Model metadata
// const modelInfo = {
//     'resnet': {
//         name: 'ResNet18 Hybrid',
//         accuracy: '94.79%',
//         trainingTime: '2581.98 seconds'
//     },
//     'mobilenet': {
//         name: 'MobileNetV2 Hybrid',
//         accuracy: '95.79%',
//         trainingTime: '2270.96 seconds'
//     },
//     'inception': {
//         name: 'InceptionV3 Hybrid',
//         accuracy: '93.39%',
//         trainingTime: '3350.57 seconds'
//     },
//     'vgg': {
//         name: 'VGG16 Hybrid',
//         accuracy: '33.27%',
//         trainingTime: '2812.86 seconds'
//     }
// };

// // Class names
// const classNames = ['Meningioma', 'Glioma', 'Pituitary'];

// // Add log entry
// function addLogEntry(message, type = 'info') {
//     const logEntry = document.createElement('div');
//     logEntry.className = `log-entry log-${type}`;
//     logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
//     logWindow.appendChild(logEntry);
//     logWindow.scrollTop = logWindow.scrollHeight;
// }

// // Update model info when selection changes
// modelSelect.addEventListener('change', function() {
//     const selectedModel = modelSelect.value;
//     modelArchitecture.textContent = modelInfo[selectedModel].name + ' with Quantum Layer';
//     modelAccuracy.textContent = modelInfo[selectedModel].accuracy;
//     addLogEntry(`Model changed to ${modelInfo[selectedModel].name}`);
// });

// // Handle file upload and preview
// imageUpload.addEventListener('change', function() {
//     const file = imageUpload.files[0];
//     if (file) {
//         const reader = new FileReader();
//         reader.onload = function(e) {
//             imagePreview.src = e.target.result;
//             previewContainer.style.display = 'block';
//             classifyBtn.disabled = false;
//             addLogEntry(`Image loaded: ${file.name}`);
//         };
//         reader.readAsDataURL(file);
//     }
// });

// // Drag and drop functionality
// const dropZone = document.querySelector('.file-upload-label');

// dropZone.addEventListener('dragover', function(e) {
//     e.preventDefault();
//     dropZone.style.borderColor = '#3498db';
//     dropZone.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
// });

// dropZone.addEventListener('dragleave', function(e) {
//     e.preventDefault();
//     dropZone.style.borderColor = '#ccc';
//     dropZone.style.backgroundColor = '';
// });

// dropZone.addEventListener('drop', function(e) {
//     e.preventDefault();
//     dropZone.style.borderColor = '#ccc';
//     dropZone.style.backgroundColor = '';
    
//     const file = e.dataTransfer.files[0];
//     if (file && file.type.match('image.*')) {
//         imageUpload.files = e.dataTransfer.files;
//         const event = new Event('change');
//         imageUpload.dispatchEvent(event);
//     }
// });

// // Create chart for displaying results
// function createResultsChart(labels, data) {
//     if (resultsChart) {
//         resultsChart.destroy();
//     }
    
//     const ctx = document.getElementById('results-chart').getContext('2d');
//     resultsChart = new Chart(ctx, {
//         type: 'bar',
//         data: {
//             labels: labels,
//             datasets: [{
//                 label: 'Confidence Score (%)',
//                 data: data,
//                 backgroundColor: [
//                     'rgba(255, 99, 132, 0.7)',
//                     'rgba(54, 162, 235, 0.7)',
//                     'rgba(255, 206, 86, 0.7)'
//                 ],
//                 borderColor: [
//                     'rgba(255, 99, 132, 1)',
//                     'rgba(54, 162, 235, 1)',
//                     'rgba(255, 206, 86, 1)'
//                 ],
//                 borderWidth: 1
//             }]
//         },
//         options: {
//             responsive: true,
//             maintainAspectRatio: false,
//             plugins: {
//                 title: {
//                     display: true,
//                     text: 'Classification Confidence by Class'
//                 },
//                 legend: {
//                     display: false
//                 }
//             },
//             scales: {
//                 y: {
//                     beginAtZero: true,
//                     max: 100
//                 }
//             }
//         }
//     });
// }

// // Perform real image classification
// classifyBtn.addEventListener('click', function() {
//     // Check if an image is selected
//     if (!imageUpload.files[0]) {
//         addLogEntry('No image selected', 'error');
//         return;
//     }
    
//     // Prepare the UI
//     loadingElement.style.display = 'block';
//     resultsContainer.innerHTML = '';
//     classifyBtn.disabled = true;
    
//     // Get selected model
//     const selectedModel = modelSelect.value;
//     addLogEntry(`Starting classification using ${modelInfo[selectedModel].name}`, 'info');
    
//     // Prepare form data
//     const formData = new FormData();
//     formData.append('image', imageUpload.files[0]);
//     formData.append('model_type', selectedModel);
    
//     // Send request to the backend
//     fetch(API_URL, {
//         method: 'POST',
//         body: formData
//     })
//     .then(response => {
//         if (!response.ok) {
//             throw new Error(`HTTP error! Status: ${response.status}`);
//         }
//         return response.json();
//     })
//     .then(data => {
        
//         // Process the classification results
//         addLogEntry(`Classification complete. Predicted: ${data.prediction.class_name}`, 'info');
        
//         // Extract confidence scores for the chart
//         const confidenceValues = Object.values(data.confidences);
        
//         // Create the chart
//         createResultsChart(classNames, confidenceValues);
        
//         // Determine confidence level class
//         let confidenceClass = 'confidence-low';
//         if (data.prediction.confidence > 70) {
//             confidenceClass = 'confidence-high';
//         } else if (data.prediction.confidence > 40) {
//             confidenceClass = 'confidence-medium';
//         }
        
//         // Display results
//         let resultsHTML = `
//             <div class="result-item">
//                 <div class="result-header">
//                     <div class="result-title">Predicted: ${data.prediction.class_name}</div>
//                     <div class="result-confidence ${confidenceClass}">
//                         ${data.prediction.confidence.toFixed(2)}%
//                     </div>
//                 </div>
//                 <div class="result-details">
//                     <p>The image appears to contain a ${data.prediction.class_name.toLowerCase()} tumor with ${data.prediction.confidence.toFixed(2)}% confidence.</p>
//                     <p>This classification was made using the ${modelInfo[selectedModel].name} model.</p>
//                 </div>
//             </div>
//         `;
        
//         resultsContainer.innerHTML = resultsHTML;
//     })
//     .catch(error => {
//         addLogEntry(`Error: ${error.message}`, 'error');
//         resultsContainer.innerHTML = `
//             <div class="result-item" style="background-color: #ffebee;">
//                 <div class="result-header">
//                     <div class="result-title">Error</div>
//                 </div>
//                 <div class="result-details">
//                     <p>${error.message}</p>
//                     <p>Make sure the backend server is running at ${API_URL}.</p>
//                 </div>
//             </div>
//         `;
//     })
//     .finally(() => {
//         loadingElement.style.display = 'none';
//         classifyBtn.disabled = false;
//     });
// });

// // Initialize with the default model info
// document.addEventListener('DOMContentLoaded', function() {
//     modelArchitecture.textContent = modelInfo[modelSelect.value].name + ' with Quantum Layer';
//     modelAccuracy.textContent = modelInfo[modelSelect.value].accuracy;
//     addLogEntry('System initialized', 'info');
//     addLogEntry('Ready to classify brain tumor MRI scans', 'info');
// });

// DOM Elements
const modelSelect = document.getElementById('model-select');
const imageUpload = document.getElementById('image-upload');
const imagePreview = document.getElementById('image-preview');
const previewContainer = document.getElementById('preview-container');
const classifyBtn = document.getElementById('classify-btn');
const resultsContainer = document.getElementById('results-container');
const loadingElement = document.querySelector('.loading');
const modelArchitecture = document.getElementById('model-architecture');
const modelAccuracy = document.getElementById('model-accuracy');
const logWindow = document.querySelector('.log-window');

// API endpoint (adjust as needed based on your server setup)
const API_URL = 'http://localhost:8080/classify';

// Chart instance
let resultsChart = null;

// Model metadata
const modelInfo = {
    'resnet': {
        name: 'ResNet18 Hybrid',
        accuracy: '94.79%',
        trainingTime: '2581.98 seconds'
    },
    'mobilenet': {
        name: 'MobileNetV2 Hybrid',
        accuracy: '95.79%',
        trainingTime: '2270.96 seconds'
    },
    'inception': {
        name: 'InceptionV3 Hybrid',
        accuracy: '93.39%',
        trainingTime: '3350.57 seconds'
    },
    'vgg': {
        name: 'VGG16 Hybrid',
        accuracy: '33.27%',
        trainingTime: '2812.86 seconds'
    }
};

// Class names - FIXED: now matches server.py order
const classNames = ['Glioma', 'Meningioma', 'Pituitary'];

// Add log entry
function addLogEntry(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry log-${type}`;
    logEntry.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
    logWindow.appendChild(logEntry);
    logWindow.scrollTop = logWindow.scrollHeight;
}

// Update model info when selection changes
modelSelect.addEventListener('change', function() {
    const selectedModel = modelSelect.value;
    modelArchitecture.textContent = modelInfo[selectedModel].name + ' with Quantum Layer';
    modelAccuracy.textContent = modelInfo[selectedModel].accuracy;
    addLogEntry(`Model changed to ${modelInfo[selectedModel].name}`);
});

// Handle file upload and preview
imageUpload.addEventListener('change', function() {
    const file = imageUpload.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            imagePreview.src = e.target.result;
            previewContainer.style.display = 'block';
            classifyBtn.disabled = false;
            addLogEntry(`Image loaded: ${file.name}`);
        };
        reader.readAsDataURL(file);
    }
});

// Drag and drop functionality
const dropZone = document.querySelector('.file-upload-label');

dropZone.addEventListener('dragover', function(e) {
    e.preventDefault();
    dropZone.style.borderColor = '#3498db';
    dropZone.style.backgroundColor = 'rgba(52, 152, 219, 0.1)';
});

dropZone.addEventListener('dragleave', function(e) {
    e.preventDefault();
    dropZone.style.borderColor = '#ccc';
    dropZone.style.backgroundColor = '';
});

dropZone.addEventListener('drop', function(e) {
    e.preventDefault();
    dropZone.style.borderColor = '#ccc';
    dropZone.style.backgroundColor = '';
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.match('image.*')) {
        imageUpload.files = e.dataTransfer.files;
        const event = new Event('change');
        imageUpload.dispatchEvent(event);
    }
});

// Create chart for displaying results
function createResultsChart(labels, data) {
    if (resultsChart) {
        resultsChart.destroy();
    }
    
    const ctx = document.getElementById('results-chart').getContext('2d');
    resultsChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Confidence Score (%)',
                data: data,
                backgroundColor: [
                    'rgba(255, 99, 132, 0.7)',
                    'rgba(54, 162, 235, 0.7)',
                    'rgba(255, 206, 86, 0.7)'
                ],
                borderColor: [
                    'rgba(255, 99, 132, 1)',
                    'rgba(54, 162, 235, 1)',
                    'rgba(255, 206, 86, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                title: {
                    display: true,
                    text: 'Classification Confidence by Class'
                },
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// Perform real image classification
classifyBtn.addEventListener('click', function() {
    // Check if an image is selected
    if (!imageUpload.files[0]) {
        addLogEntry('No image selected', 'error');
        return;
    }
    
    // Prepare the UI
    loadingElement.style.display = 'block';
    resultsContainer.innerHTML = '';
    classifyBtn.disabled = true;
    
    // Get selected model
    const selectedModel = modelSelect.value;
    addLogEntry(`Starting classification using ${modelInfo[selectedModel].name}`, 'info');
    
    // Prepare form data
    const formData = new FormData();
    formData.append('image', imageUpload.files[0]);
    formData.append('model_type', selectedModel);
    
    // Send request to the backend
    fetch(API_URL, {
        method: 'POST',
        body: formData
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        
        // Process the classification results
        addLogEntry(`Classification complete. Predicted: ${data.prediction.class_name}`, 'info');
        
        // Extract confidence scores for the chart
        const confidenceValues = Object.values(data.confidences);
        
        // Create the chart
        createResultsChart(classNames, confidenceValues);
        
        // Determine confidence level class
        let confidenceClass = 'confidence-low';
        if (data.prediction.confidence > 70) {
            confidenceClass = 'confidence-high';
        } else if (data.prediction.confidence > 40) {
            confidenceClass = 'confidence-medium';
        }
        
        // Display results
        let resultsHTML = `
            <div class="result-item">
                <div class="result-header">
                    <div class="result-title">Predicted: ${data.prediction.class_name}</div>
                    <div class="result-confidence ${confidenceClass}">
                        ${data.prediction.confidence.toFixed(2)}%
                    </div>
                </div>
                <div class="result-details">
                    <p>The image appears to contain a ${data.prediction.class_name.toLowerCase()} tumor with ${data.prediction.confidence.toFixed(2)}% confidence.</p>
                    <p>This classification was made using the ${modelInfo[selectedModel].name} model.</p>
                </div>
            </div>
        `;
        
        resultsContainer.innerHTML = resultsHTML;
    })
    .catch(error => {
        addLogEntry(`Error: ${error.message}`, 'error');
        resultsContainer.innerHTML = `
            <div class="result-item" style="background-color: #ffebee;">
                <div class="result-header">
                    <div class="result-title">Error</div>
                </div>
                <div class="result-details">
                    <p>${error.message}</p>
                    <p>Make sure the backend server is running at ${API_URL}.</p>
                </div>
            </div>
        `;
    })
    .finally(() => {
        loadingElement.style.display = 'none';
        classifyBtn.disabled = false;
    });
});

// Initialize with the default model info
document.addEventListener('DOMContentLoaded', function() {
    modelArchitecture.textContent = modelInfo[modelSelect.value].name + ' with Quantum Layer';
    modelAccuracy.textContent = modelInfo[modelSelect.value].accuracy;
    addLogEntry('System initialized', 'info');
    addLogEntry('Ready to classify brain tumor MRI scans', 'info');
});
