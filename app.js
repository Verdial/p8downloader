const urlInput = document.getElementById('urlInput');
const urlPreview = document.getElementById('urlPreview');
const detectedInfo = document.getElementById('detectedInfo');
const loading = document.getElementById('loading');
const result = document.getElementById('result');
const btnDownload = document.getElementById('btnDownload');
const btnView = document.getElementById('btnView');

let extractedData = null;

// Fungsi untuk extract informasi dari URL Lexaloffle
function extractFromUrl(url) {
    try {
        // Pattern untuk berbagai format URL Lexaloffle
        const patterns = [
            // Format: https://www.lexaloffle.com/bbs/?pid=12345
            /lexaloffle\.com\/bbs\/\?pid=(\d+)/,
            // Format: https://www.lexaloffle.com/bbs/?tid=12345
            /lexaloffle\.com\/bbs\/\?tid=(\d+)/,
            // Format langsung ke cposts
            /lexaloffle\.com\/bbs\/cposts\/(\d+)\/([^\/]+)\.p8\.png/
        ];

        for (let pattern of patterns) {
            const match = url.match(pattern);
            if (match) {
                if (match[2]) {
                    // Jika sudah ada filename langsung
                    return {
                        postId: match[1],
                        filename: match[2],
                        direct: true
                    };
                } else {
                    // Hanya ada post ID
                    return {
                        postId: match[1],
                        direct: false
                    };
                }
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

// Fungsi untuk fetch dan extract filename dari halaman
async function fetchFilename(postId) {
    try {
        const pageUrl = `https://www.lexaloffle.com/bbs/?pid=${postId}`;
        const response = await fetch(pageUrl);
        const html = await response.text();
        
        // Cari pattern .p8.png dalam HTML
        const match = html.match(/cposts\/\d+\/([^"']+)\.p8\.png/);
        if (match) {
            return match[1];
        }
        
        // Coba pattern alternatif
        const match2 = html.match(/\/bbs\/cposts\/\d+\/([^"'\/]+)\.p8\.png/);
        if (match2) {
            return match2[1];
        }
        
        return null;
    } catch (e) {
        console.error('Error fetching page:', e);
        return null;
    }
}

// Update UI saat URL berubah
async function handleUrlChange() {
    const url = urlInput.value.trim();
    
    if (!url) {
        urlPreview.textContent = 'File URL akan muncul di sini...';
        detectedInfo.style.display = 'none';
        btnDownload.disabled = true;
        btnView.disabled = true;
        extractedData = null;
        return;
    }

    const data = extractFromUrl(url);
    
    if (!data) {
        urlPreview.textContent = '❌ URL tidak valid. Paste link dari Lexaloffle.com';
        detectedInfo.style.display = 'none';
        btnDownload.disabled = true;
        btnView.disabled = true;
        extractedData = null;
        return;
    }

    if (data.direct) {
        // Sudah ada filename langsung
        extractedData = data;
        const fileUrl = `https://www.lexaloffle.com/bbs/cposts/${data.postId}/${data.filename}.p8.png`;
        urlPreview.textContent = fileUrl;
        detectedInfo.textContent = `✓ Terdeteksi: Post ID: ${data.postId}, File: ${data.filename}.p8.png`;
        detectedInfo.style.display = 'block';
        btnDownload.disabled = false;
        btnView.disabled = false;
    } else {
        // Perlu fetch filename
        detectedInfo.textContent = `⏳ Mencari file untuk Post ID: ${data.postId}...`;
        detectedInfo.style.display = 'block';
        btnDownload.disabled = true;
        btnView.disabled = true;
        
        const filename = await fetchFilename(data.postId);
        
        if (filename) {
            extractedData = {
                postId: data.postId,
                filename: filename
            };
            const fileUrl = `https://www.lexaloffle.com/bbs/cposts/${data.postId}/${filename}.p8.png`;
            urlPreview.textContent = fileUrl;
            detectedInfo.textContent = `✓ File ditemukan: ${filename}.p8.png`;
            detectedInfo.style.display = 'block';
            btnDownload.disabled = false;
            btnView.disabled = false;
        } else {
            urlPreview.textContent = '❌ File .p8.png tidak ditemukan di halaman ini';
            detectedInfo.textContent = '✗ Tidak dapat menemukan file .p8.png';
            detectedInfo.style.display = 'block';
            btnDownload.disabled = true;
            btnView.disabled = true;
            extractedData = null;
        }
    }
}

// Event listener untuk input URL
urlInput.addEventListener('input', handleUrlChange);
urlInput.addEventListener('paste', () => {
    setTimeout(handleUrlChange, 100);
});

// Fungsi untuk mendapatkan URL file
function getFileUrl() {
    if (!extractedData) {
        showResult('error', '❌ Mohon paste link Lexaloffle yang valid!');
        return null;
    }

    return `https://www.lexaloffle.com/bbs/cposts/${extractedData.postId}/${extractedData.filename}.p8.png`;
}

// Fungsi untuk menampilkan hasil
function showResult(type, message) {
    result.className = `result ${type}`;
    result.textContent = message;
    result.style.display = 'block';
}

// Fungsi untuk menyembunyikan hasil
function hideResult() {
    result.style.display = 'none';
}

// Fungsi download file
async function downloadFile() {
    const url = getFileUrl();
    if (!url) return;

    hideResult();
    loading.style.display = 'block';
    btnDownload.disabled = true;
    btnView.disabled = true;

    try {
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error(`File tidak ditemukan (${response.status})`);
        }

        const blob = await response.blob();
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `${extractedData.filename}.p8.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(downloadUrl);

        showResult('success', '✅ File berhasil didownload!');
    } catch (error) {
        showResult('error', `❌ Error: ${error.message}`);
    } finally {
        loading.style.display = 'none';
        btnDownload.disabled = false;
        btnView.disabled = false;
    }
}

// Fungsi view source
function viewSource() {
    const url = getFileUrl();
    if (!url) return;

    window.open(url, '_blank');
    showResult('success', '✅ File dibuka di tab baru!');
}

// Event listeners untuk tombol
btnDownload.addEventListener('click', downloadFile);
btnView.addEventListener('click', viewSource);

// Support untuk Enter key
urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter' && !btnDownload.disabled) {
        downloadFile();
    }
});
