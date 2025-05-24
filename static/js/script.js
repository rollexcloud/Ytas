document.addEventListener('DOMContentLoaded', function() {
    // DOM elements
    const urlForm = document.getElementById('url-form');
    const videoUrlInput = document.getElementById('video-url');
    const loadingElement = document.getElementById('loading');
    const errorMessageElement = document.getElementById('error-message');
    const videoInfoElement = document.getElementById('video-info');
    const videoThumbnail = document.getElementById('video-thumbnail');
    const videoTitle = document.getElementById('video-title');
    const videoAuthor = document.getElementById('video-author');
    const videoDuration = document.getElementById('video-duration');
    const videoViews = document.getElementById('video-views');
    const streamsTable = document.getElementById('streams-table');
    const downloadProgressElement = document.getElementById('download-progress');
    const downloadSuccessElement = document.getElementById('download-success');
    const downloadLink = document.getElementById('download-link');
    const downloadAnotherButton = document.getElementById('download-another');

    // Event listeners
    urlForm.addEventListener('submit', handleUrlSubmit);
    downloadAnotherButton.addEventListener('click', resetForm);

    // Handle URL form submission
    function handleUrlSubmit(event) {
        event.preventDefault();
        
        const url = videoUrlInput.value.trim();
        
        if (!url) {
            showError('Please enter a YouTube URL');
            return;
        }
        
        // Show loading spinner
        hideAllSections();
        loadingElement.classList.remove('d-none');
        
        // Fetch video information
        fetchVideoInfo(url);
    }

    // Fetch video information from the server
    function fetchVideoInfo(url) {
        const formData = new FormData();
        formData.append('url', url);
        
        fetch('/get-video-info', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            loadingElement.classList.add('d-none');
            
            if (!data.success) {
                showError(data.message);
                return;
            }
            
            displayVideoInfo(data.video_info);
        })
        .catch(error => {
            loadingElement.classList.add('d-none');
            showError('An error occurred. Please try again.');
            console.error('Error:', error);
        });
    }

    // Display video information
    function displayVideoInfo(videoInfo) {
        // Set video details
        videoThumbnail.src = videoInfo.thumbnail_url;
        videoTitle.textContent = videoInfo.title;
        videoAuthor.textContent = videoInfo.author;
        videoDuration.textContent = formatDuration(videoInfo.length_seconds);
        videoViews.textContent = formatNumber(videoInfo.views);
        
        // Clear existing streams
        streamsTable.innerHTML = '';
        
        // Add streams to the table
        videoInfo.streams.forEach(stream => {
            const row = document.createElement('tr');
            
            // Quality column
            const qualityCell = document.createElement('td');
            qualityCell.textContent = stream.resolution || 'Audio';
            if (stream.fps && stream.resolution !== 'Audio only') {
                qualityCell.textContent += ` (${stream.fps}fps)`;
            }
            if (stream.abr) {
                qualityCell.textContent += ` (${stream.abr})`;
            }
            row.appendChild(qualityCell);
            
            // Format column
            const formatCell = document.createElement('td');
            formatCell.textContent = stream.mime_type;
            row.appendChild(formatCell);
            
            // Size column
            const sizeCell = document.createElement('td');
            sizeCell.textContent = `${stream.size_mb} MB`;
            row.appendChild(sizeCell);
            
            // Action column
            const actionCell = document.createElement('td');
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'btn btn-primary btn-sm download-btn';
            downloadBtn.innerHTML = '<i class="fas fa-download me-1"></i> Download';
            downloadBtn.setAttribute('data-itag', stream.itag);
            downloadBtn.addEventListener('click', () => handleDownload(stream.itag));
            actionCell.appendChild(downloadBtn);
            row.appendChild(actionCell);
            
            streamsTable.appendChild(row);
        });
        
        // Show video info section
        videoInfoElement.classList.remove('d-none');
    }

    // Handle download button click
    function handleDownload(itag) {
        // Show download progress
        hideAllSections();
        downloadProgressElement.classList.remove('d-none');
        
        // Create form data
        const formData = new FormData();
        formData.append('itag', itag);
        
        // Send download request
        fetch('/download', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            downloadProgressElement.classList.add('d-none');
            
            if (!data.success) {
                showError(data.message);
                return;
            }
            
            // Show success message
            downloadSuccessElement.classList.remove('d-none');
            
            // Set download link
            downloadLink.href = `/get-file/${data.download_id}`;
            downloadLink.setAttribute('download', data.filename);
            
            // Automatically trigger download after 1 second
            setTimeout(() => {
                downloadLink.click();
            }, 1000);
        })
        .catch(error => {
            downloadProgressElement.classList.add('d-none');
            showError('An error occurred during download. Please try again.');
            console.error('Error:', error);
        });
    }

    // Utility functions
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;
        
        if (hours > 0) {
            return `${hours}:${padZero(minutes)}:${padZero(secs)}`;
        } else {
            return `${minutes}:${padZero(secs)}`;
        }
    }
    
    function padZero(num) {
        return num < 10 ? `0${num}` : num;
    }
    
    function formatNumber(num) {
        return new Intl.NumberFormat().format(num);
    }
    
    function showError(message) {
        errorMessageElement.textContent = message;
        errorMessageElement.classList.remove('d-none');
        setTimeout(() => {
            errorMessageElement.classList.add('d-none');
        }, 5000);
    }
    
    function hideAllSections() {
        videoInfoElement.classList.add('d-none');
        loadingElement.classList.add('d-none');
        errorMessageElement.classList.add('d-none');
        downloadProgressElement.classList.add('d-none');
        downloadSuccessElement.classList.add('d-none');
    }
    
    function resetForm() {
        hideAllSections();
        videoUrlInput.value = '';
        videoUrlInput.focus();
    }
});
              
