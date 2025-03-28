export function dragAndDrop () {
    const dropZone = document.querySelector('.drop-zone') as HTMLDivElement;
    const fileInfo = document.querySelector('.file-info') as HTMLDivElement;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
        document.body.addEventListener(eventName, preventDefaults, false);
    });

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            preventDefaults(e);
            dropZone.classList.add('dragover');
        });
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, (e) => {
            preventDefaults(e);
            dropZone.classList.remove('dragover');
        });
    });

    function preventDefaults(e: Event) {
        e.preventDefault();
        e.stopPropagation();
    }

    function formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    const input = document.getElementById("fileInput") as HTMLInputElement;

    dropZone.addEventListener('drop', async (e) => {
        preventDefaults(e);
        const dt = e.dataTransfer;
        if (dt?.files && dt.files[0]) {
            const file = dt.files[0];
            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);
            input.files = dataTransfer.files;
            
            input.dispatchEvent(new Event('change'));
        }
    });

    input.addEventListener('change', async (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (!file) return;
        
        if (fileInfo) {
            fileInfo.textContent = `Wybrany plik: ${file.name} (${formatFileSize(file.size)})`;
        }
    });
}