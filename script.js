class ImageConverter {
    constructor() {
        this.uploadedFiles = [];
        this.processedImages = [];
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        this.uploadArea = document.getElementById('uploadArea');
        this.fileInput = document.getElementById('fileInput');
        this.controlsSection = document.getElementById('controlsSection');
        this.previewSection = document.getElementById('previewSection');
        this.imagesGrid = document.getElementById('imagesGrid');
        this.formatSelect = document.getElementById('formatSelect');
        this.qualitySlider = document.getElementById('qualitySlider');
        this.qualityValue = document.getElementById('qualityValue');
        this.maxWidth = document.getElementById('maxWidth');
        this.maxHeight = document.getElementById('maxHeight');
        this.processBtn = document.getElementById('processBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.loadingOverlay = document.getElementById('loadingOverlay');
    }

    setupEventListeners() {
        // File input change
        this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Drag and drop
        this.uploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.uploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.uploadArea.addEventListener('drop', (e) => this.handleDrop(e));

        // Quality slider
        this.qualitySlider.addEventListener('input', (e) => {
            this.qualityValue.textContent = e.target.value;
        });

        // Process button
        this.processBtn.addEventListener('click', () => this.processImages());

        // Clear button
        this.clearBtn.addEventListener('click', () => this.clearAll());
    }

    handleFileSelect(event) {
        const files = Array.from(event.target.files);
        this.addFiles(files);
    }

    handleDragOver(event) {
        event.preventDefault();
        this.uploadArea.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
    }

    handleDrop(event) {
        event.preventDefault();
        this.uploadArea.classList.remove('dragover');
        const files = Array.from(event.dataTransfer.files);
        this.addFiles(files);
    }

    addFiles(files) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        
        if (imageFiles.length === 0) {
            this.showNotification('Please select image files only.', 'error');
            return;
        }

        this.uploadedFiles = [...this.uploadedFiles, ...imageFiles];
        this.showControls();
        this.showNotification(`${imageFiles.length} image(s) added successfully!`, 'success');
    }

    showControls() {
        this.controlsSection.style.display = 'block';
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
        `;

        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'success' ? '#28a745' : type === 'error' ? '#dc3545' : '#17a2b8'};
            color: white;
            padding: 15px 20px;
            border-radius: 10px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 500;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    async processImages() {
        if (this.uploadedFiles.length === 0) {
            this.showNotification('Please upload some images first.', 'error');
            return;
        }

        this.showLoading(true);
        this.processedImages = [];

        try {
            for (let i = 0; i < this.uploadedFiles.length; i++) {
                const file = this.uploadedFiles[i];
                const processedImage = await this.processImage(file);
                this.processedImages.push(processedImage);
            }

            this.displayProcessedImages();
            this.showNotification('All images processed successfully!', 'success');
        } catch (error) {
            console.error('Error processing images:', error);
            this.showNotification('Error processing images. Please try again.', 'error');
        } finally {
            this.showLoading(false);
        }
    }

    async processImage(file) {
        return new Promise((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();

            img.onload = () => {
                // Calculate new dimensions
                let { width, height } = this.calculateDimensions(img.width, img.height);

                // Set canvas dimensions
                canvas.width = width;
                canvas.height = height;

                // Draw and resize image
                ctx.drawImage(img, 0, 0, width, height);

                // Get quality
                const quality = this.qualitySlider.value / 100;

                // Convert to desired format
                const format = this.formatSelect.value;
                const mimeType = `image/${format}`;

                // Convert canvas to blob
                canvas.toBlob((blob) => {
                    const processedFile = new File([blob], this.getNewFileName(file.name, format), {
                        type: mimeType
                    });

                    resolve({
                        original: file,
                        processed: processedFile,
                        originalSize: file.size,
                        processedSize: blob.size,
                        compressionRatio: ((file.size - blob.size) / file.size * 100).toFixed(1),
                        dimensions: `${width}x${height}`,
                        format: format.toUpperCase()
                    });
                }, mimeType, quality);
            };

            img.src = URL.createObjectURL(file);
        });
    }

    calculateDimensions(originalWidth, originalHeight) {
        const maxWidth = this.maxWidth.value ? parseInt(this.maxWidth.value) : originalWidth;
        const maxHeight = this.maxHeight.value ? parseInt(this.maxHeight.value) : originalHeight;

        let width = originalWidth;
        let height = originalHeight;

        // Calculate aspect ratio
        const aspectRatio = width / height;

        // Resize if needed
        if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
        }

        if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
        }

        return { width: Math.round(width), height: Math.round(height) };
    }

    getNewFileName(originalName, format) {
        const nameWithoutExt = originalName.substring(0, originalName.lastIndexOf('.'));
        return `${nameWithoutExt}.${format}`;
    }

    displayProcessedImages() {
        this.imagesGrid.innerHTML = '';
        this.previewSection.style.display = 'block';

        this.processedImages.forEach((imageData, index) => {
            const imageCard = this.createImageCard(imageData, index);
            this.imagesGrid.appendChild(imageCard);
        });
    }

    createImageCard(imageData, index) {
        const card = document.createElement('div');
        card.className = 'image-card';

        const originalSize = this.formatFileSize(imageData.originalSize);
        const processedSize = this.formatFileSize(imageData.processedSize);

        card.innerHTML = `
            <img src="${URL.createObjectURL(imageData.processed)}" alt="Processed image" class="image-preview">
            <div class="image-info">
                <div class="image-name">${imageData.processed.name}</div>
                <div class="image-details">
                    <div><strong>Format:</strong> ${imageData.format}</div>
                    <div><strong>Dimensions:</strong> ${imageData.dimensions}</div>
                    <div><strong>Original Size:</strong> ${originalSize}</div>
                    <div><strong>New Size:</strong> ${processedSize}</div>
                    <div><strong>Compression:</strong> ${imageData.compressionRatio}% smaller</div>
                </div>
                <button class="download-btn" onclick="imageConverter.downloadImage(${index})">
                    <i class="fas fa-download"></i>
                    Download
                </button>
            </div>
        `;

        return card;
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    downloadImage(index) {
        const imageData = this.processedImages[index];
        const url = URL.createObjectURL(imageData.processed);
        const a = document.createElement('a');
        a.href = url;
        a.download = imageData.processed.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showNotification('Download started!', 'success');
    }

    downloadAllImages() {
        if (this.processedImages.length === 0) {
            this.showNotification('No processed images to download.', 'error');
            return;
        }

        this.processedImages.forEach((imageData, index) => {
            setTimeout(() => {
                this.downloadImage(index);
            }, index * 500); // Stagger downloads
        });

        this.showNotification('All downloads started!', 'success');
    }

    clearAll() {
        this.uploadedFiles = [];
        this.processedImages = [];
        this.controlsSection.style.display = 'none';
        this.previewSection.style.display = 'none';
        this.fileInput.value = '';
        this.imagesGrid.innerHTML = '';
        
        this.showNotification('All images cleared.', 'info');
    }

    showLoading(show) {
        this.loadingOverlay.style.display = show ? 'flex' : 'none';
    }
}

// Initialize the image converter when the page loads
let imageConverter;
document.addEventListener('DOMContentLoaded', () => {
    imageConverter = new ImageConverter();
    initializeFAQ();
    
    // Add CSS animations
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
    `;
    document.head.appendChild(style);
});

// FAQ functionality
function initializeFAQ() {
    const faqItems = document.querySelectorAll('.faq-item');
    
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        
        question.addEventListener('click', () => {
            const isActive = item.classList.contains('active');
            
            // Close all FAQ items
            faqItems.forEach(faqItem => {
                faqItem.classList.remove('active');
            });
            
            // Open clicked item if it wasn't active
            if (!isActive) {
                item.classList.add('active');
            }
        });
    });
}
