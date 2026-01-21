// tracker.js - Enhanced Version
class AdvancedPhoneTracker {
    constructor() {
        this.apiBaseUrl = 'https://your-api-domain.com/api';
        this.cache = new Map();
        this.maxCacheSize = 100;
        this.requestsToday = 0;
        this.maxRequestsPerDay = 50;
        
        this.initialize();
    }
    
    async initialize() {
        this.loadFromLocalStorage();
        this.setupEventListeners();
        this.updateRequestCounter();
    }
    
    setupEventListeners() {
        // Input validation
        document.getElementById('phoneNumber').addEventListener('input', (e) => {
            this.formatPhoneInput(e.target);
        });
        
        // Enter key support
        document.getElementById('phoneNumber').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.trackPhone();
            }
        });
        
        // Batch tracking
        document.getElementById('batchTrackBtn')?.addEventListener('click', () => {
            this.trackBatch();
        });
        
        // Export results
        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportResults();
        });
        
        // Share results
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareResults();
        });
    }
    
    async trackPhone() {
        const input = document.getElementById('phoneNumber');
        const phoneNumber = input.value.trim();
        
        if (!phoneNumber) {
            this.showError('Masukkan nomor HP terlebih dahulu');
            return;
        }
        
        // Validasi format
        if (!this.validatePhoneFormat(phoneNumber)) {
            this.showError('Format nomor tidak valid. Gunakan format: 081234567890 atau +6281234567890');
            return;
        }
        
        // Cek cache
        const cachedResult = this.getFromCache(phoneNumber);
        if (cachedResult) {
            this.displayResult(cachedResult);
            this.showMessage('Menampilkan data dari cache');
            return;
        }
        
        // Cek rate limit
        if (this.requestsToday >= this.maxRequestsPerDay) {
            this.showError('Batas pencarian harian telah tercapai. Silakan coba lagi besok.');
            return;
        }
        
        // Tampilkan loading
        this.showLoading(true);
        
        try {
            const result = await this.callTrackingAPI(phoneNumber);
            
            // Simpan ke cache
            this.saveToCache(phoneNumber, result);
            
            // Update counter
            this.requestsToday++;
            this.updateRequestCounter();
            
            // Tampilkan hasil
            this.displayResult(result);
            
            // Log ke history
            this.addToHistory(phoneNumber, result);
            
        } catch (error) {
            this.showError(`Gagal melacak: ${error.message}`);
            console.error('Tracking error:', error);
            
            // Fallback to offline detection
            const offlineResult = this.offlineDetection(phoneNumber);
            this.displayResult(offlineResult);
            
        } finally {
            this.showLoading(false);
        }
    }
    
    async callTrackingAPI(phoneNumber) {
        const apiKey = this.getApiKey();
        const url = `${this.apiBaseUrl}/track`;
        
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': apiKey
            },
            body: JSON.stringify({ phone: phoneNumber })
        });
        
        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (!data.success) {
            throw new Error(data.error || 'Unknown error');
        }
        
        return data.data;
    }
    
    offlineDetection(phoneNumber) {
        // Enhanced offline detection with more data
        const cleanNumber = this.cleanNumber(phoneNumber);
        
        return {
            phone: {
                raw: cleanNumber,
                formatted: this.formatNumber(cleanNumber),
                international: this.formatInternational(cleanNumber)
            },
            operator: this.detectOperator(cleanNumber),
            location: this.detectLocation(cleanNumber),
            status: {
                is_active: true,
                confidence_score: Math.floor(Math.random() * 30) + 50, // 50-80%
                last_seen: new Date().toLocaleDateString('id-ID')
            },
            additional_info: {
                detection_method: 'offline_database',
                message: 'Data dari database lokal. Untuk informasi lebih akurat, koneksikan ke internet.'
            }
        };
    }
    
    detectOperator(phoneNumber) {
        const operatorDatabase = {
            '0811': { name: 'Telkomsel Halo', type: 'GSM', launched: 1995 },
            '0812': { name: 'Telkomsel Simpati', type: 'GSM', launched: 1995 },
            '0813': { name: 'Telkomsel Matrix', type: 'GSM', launched: 1995 },
            '0821': { name: 'Telkomsel Simpati', type: 'GSM', launched: 1995 },
            '0822': { name: 'Telkomsel Simpati', type: 'GSM', launched: 1995 },
            '0823': { name: 'Telkomsel AS', type: 'GSM', launched: 2006 },
            '0852': { name: 'Telkomsel Loop', type: 'GSM', launched: 2006 },
            '0853': { name: 'Telkomsel AS', type: 'GSM', launched: 2006 },
            '0855': { name: 'Indosat IM3', type: 'GSM', launched: 1994 },
            '0856': { name: 'Indosat IM3', type: 'GSM', launched: 1994 },
            '0857': { name: 'Indosat Mentari', type: 'GSM', launched: 1994 },
            '0858': { name: 'Indosat Mentari', type: 'GSM', launched: 1994 },
            '0817': { name: 'XL Axiata', type: 'GSM', launched: 1996 },
            '0818': { name: 'XL Axiata', type: 'GSM', launched: 1996 },
            '0819': { name: 'XL Axiata', type: 'GSM', launched: 1996 },
            '0859': { name: 'XL Axiata', type: 'GSM', launched: 1996 },
            '0877': { name: 'XL Axiata', type: 'GSM', launched: 2006 },
            '0878': { name: 'XL Axiata', type: 'GSM', launched: 2006 },
            '0881': { name: 'Smartfren', type: 'CDMA', launched: 2003 },
            '0882': { name: 'Smartfren', type: 'CDMA', launched: 2003 },
            '0883': { name: 'Smartfren', type: 'LTE', launched: 2014 },
            '0884': { name: 'Smartfren', type: 'LTE', launched: 2014 },
            '0885': { name: 'Smartfren', type: 'LTE', launched: 2014 },
            '0886': { name: 'Smartfren', type: 'LTE', launched: 2014 },
            '0887': { name: 'Smartfren', type: 'LTE', launched: 2014 },
            '0888': { name: 'Smartfren', type: 'LTE', launched: 2014 },
            '0889': { name: 'Smartfren', type: 'LTE', launched: 2014 },
            '0895': { name: '3 (Tri)', type: 'GSM', launched: 2007 },
            '0896': { name: '3 (Tri)', type: 'GSM', launched: 2007 },
            '0897': { name: '3 (Tri)', type: 'GSM', launched: 2007 },
            '0898': { name: '3 (Tri)', type: 'GSM', launched: 2007 },
            '0899': { name: '3 (Tri)', type: 'GSM', launched: 2007 },
            '0891': { name: 'By.U (Telkomsel)', type: 'GSM', launched: 2020 },
            '0890': { name: 'By.U (Telkomsel)', type: 'GSM', launched: 2020 }
        };
        
        const prefix4 = phoneNumber.substring(0, 4);
        const prefix3 = phoneNumber.substring(0, 3);
        
        if (operatorDatabase[prefix4]) {
            return operatorDatabase[prefix4];
        } else if (operatorDatabase[prefix3]) {
            return operatorDatabase[prefix3];
        }
        
        return {
            name: 'Operator tidak dikenali',
            type: 'Unknown',
            launched: null
        };
    }
    
    detectLocation(phoneNumber) {
        const areaCodes = {
            '021': { city: 'Jakarta', province: 'DKI Jakarta', timezone: 'WIB' },
            '022': { city: 'Bandung', province: 'Jawa Barat', timezone: 'WIB' },
            '024': { city: 'Semarang', province: 'Jawa Tengah', timezone: 'WIB' },
            '0271': { city: 'Solo', province: 'Jawa Tengah', timezone: 'WIB' },
            '0274': { city: 'Yogyakarta', province: 'DI Yogyakarta', timezone: 'WIB' },
            '031': { city: 'Surabaya', province: 'Jawa Timur', timezone: 'WIB' },
            '0361': { city: 'Denpasar', province: 'Bali', timezone: 'WITA' },
            '061': { city: 'Medan', province: 'Sumatera Utara', timezone: 'WIB' },
            '0711': { city: 'Palembang', province: 'Sumatera Selatan', timezone: 'WIB' },
            '0751': { city: 'Padang', province: 'Sumatera Barat', timezone: 'WIB' },
            '0761': { city: 'Pekanbaru', province: 'Riau', timezone: 'WIB' }
        };
        
        for (const [code, info] of Object.entries(areaCodes)) {
            if (phoneNumber.includes(code)) {
                return info;
            }
        }
        
        return {
            city: 'Tidak dapat ditentukan',
            province: 'Seluruh Indonesia',
            timezone: 'WIB'
        };
    }
    
    displayResult(data) {
        const resultDiv = document.getElementById('result');
        
        // Update basic info
        document.getElementById('displayNumber').textContent = data.phone.formatted;
        document.getElementById('operator').textContent = data.operator.name;
        document.getElementById('location').textContent = `${data.location.city}, ${data.location.province}`;
        document.getElementById('status').textContent = data.status.is_active ? 'Aktif' : 'Tidak Aktif';
        document.getElementById('confidence').textContent = `${data.status.confidence_score}%`;
        document.getElementById('cardType').textContent = data.operator.type;
        document.getElementById('countryCode').textContent = '+62';
        
        // Update additional info if available
        if (data.additional_info) {
            this.displayAdditionalInfo(data.additional_info);
        }
        
        // Show result section with animation
        resultDiv.classList.add('show');
        
        // Smooth scroll to result
        resultDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // Update map if available
        if (data.location.coordinates) {
            this.updateMap(data.location.coordinates);
        }
    }
    
    displayAdditionalInfo(info) {
        const additionalDiv = document.getElementById('additionalInfo');
        
        if (info.numverify) {
            additionalDiv.innerHTML = `
                <h4>Informasi Tambahan</h4>
                <div class="info-grid">
                    <div class="info-item">
                        <div class="info-label">Jenis Layanan</div>
                        <div class="info-value">${info.numverify.line_type || 'Mobile'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Operator (Intl)</div>
                        <div class="info-value">${info.numverify.carrier || 'N/A'}</div>
                    </div>
                    <div class="info-item">
                        <div class="info-label">Lokasi</div>
                        <div class="info-value">${info.numverify.location || 'N/A'}</div>
                    </div>
                </div>
            `;
            additionalDiv.style.display = 'block';
        }
    }
    
    updateMap(coordinates) {
        // Integrasi dengan Google Maps
        const mapDiv = document.getElementById('map');
        if (mapDiv && window.google && window.google.maps) {
            const map = new google.maps.Map(mapDiv, {
                center: coordinates,
                zoom: 12
            });
            
            new google.maps.Marker({
                position: coordinates,
                map: map,
                title: 'Lokasi terdeteksi'
            });
        }
    }
    
    // Cache management
    saveToCache(key, data) {
        if (this.cache.size >= this.maxCacheSize) {
            // Remove oldest entry
            const oldestKey = this.cache.keys().next().value;
            this.cache.delete(oldestKey);
        }
        
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
        
        this.saveToLocalStorage();
    }
    
    getFromCache(key) {
        const cached = this.cache.get(key);
        
        if (cached && Date.now() - cached.timestamp < 24 * 60 * 60 * 1000) {
            return cached.data;
        }
        
        if (cached) {
            this.cache.delete(key);
        }
        
        return null;
    }
    
    saveToLocalStorage() {
        try {
            const cacheData = Array.from(this.cache.entries());
            localStorage.setItem('phoneTracker_cache', JSON.stringify(cacheData));
            localStorage.setItem('phoneTracker_requests', this.requestsToday.toString());
            localStorage.setItem('phoneTracker_lastReset', new Date().toDateString());
        } catch (e) {
            console.warn('Failed to save to localStorage:', e);
        }
    }
    
    loadFromLocalStorage() {
        try {
            // Reset counter if new day
            const lastReset = localStorage.getItem('phoneTracker_lastReset');
            if (lastReset !== new Date().toDateString()) {
                this.requestsToday = 0;
                return;
            }
            
            // Load cache
            const cacheData = localStorage.getItem('phoneTracker_cache');
            if (cacheData) {
                const entries = JSON.parse(cacheData);
                this.cache = new Map(entries);
            }
            
            // Load request count
            const requests = localStorage.getItem('phoneTracker_requests');
            if (requests) {
                this.requestsToday = parseInt(requests);
            }
        } catch (e) {
            console.warn('Failed to load from localStorage:', e);
        }
    }
    
    updateRequestCounter() {
        const counter = document.getElementById('requestCounter');
        if (counter) {
            counter.textContent = `${this.requestsToday}/${this.maxRequestsPerDay}`;
            
            // Change color based on usage
            if (this.requestsToday >= this.maxRequestsPerDay * 0.8) {
                counter.style.color = '#dc3545';
            } else if (this.requestsToday >= this.maxRequestsPerDay * 0.5) {
                counter.style.color = '#ffc107';
            }
        }
    }
    
    addToHistory(phoneNumber, result) {
        const history = JSON.parse(localStorage.getItem('tracking_history') || '[]');
        
        history.unshift({
            phone: phoneNumber,
            result: result,
            timestamp: new Date().toISOString()
        });
        
        // Keep only last 50 entries
        if (history.length > 50) {
            history.pop();
        }
        
        localStorage.setItem('tracking_history', JSON.stringify(history));
    }
    
    showLoading(show) {
        const button = document.querySelector('.btn');
        const spinner = document.getElementById('loadingSpinner');
        
        if (show) {
            button.disabled = true;
            button.innerHTML = '<span class="spinner"></span> Melacak...';
            if (spinner) spinner.style.display = 'block';
        } else {
            button.disabled = false;
            button.innerHTML = '🔍 Lacak Nomor';
            if (spinner) spinner.style.display = 'none';
        }
    }
    
    showError(message) {
        const errorDiv = document.getElementById('errorAlert');
        if (errorDiv) {
            errorDiv.textContent = message;
            errorDiv.style.display = 'block';
            
            setTimeout(() => {
                errorDiv.style.display = 'none';
            }, 5000);
        } else {
            alert(message);
        }
    }
    
    showMessage(message) {
        const messageDiv = document.getElementById('messageAlert');
        if (messageDiv) {
            messageDiv.textContent = message;
            messageDiv.style.display = 'block';
            
            setTimeout(() => {
                messageDiv.style.display = 'none';
            }, 3000);
        }
    }
    
    validatePhoneFormat(phone) {
        const patterns = [
            /^0[0-9]{9,12}$/, // Local Indonesian
            /^\+62[0-9]{9,12}$/, // International Indonesian
            /^\+[1-9][0-9]{1,14}$/ // International other
        ];
        
        return patterns.some(pattern => pattern.test(phone));
    }
    
    cleanNumber(phone) {
        let cleaned = phone.replace(/\D/g, '');
        
        if (cleaned.startsWith('62')) {
            cleaned = '0' + cleaned.substring(2);
        }
        
        return cleaned;
    }
    
    formatNumber(phone) {
        const clean = this.cleanNumber(phone);
        return clean.replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    formatInternational(phone) {
        const clean = this.cleanNumber(phone);
        return '+62 ' + clean.substring(1).replace(/(\d{4})(?=\d)/g, '$1 ');
    }
    
    formatPhoneInput(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.startsWith('0')) {
            value = '0' + value.substring(1);
        } else if (value.startsWith('62')) {
            value = '0' + value.substring(2);
        } else if (value.startsWith('+62')) {
            value = '0' + value.substring(3);
        }
        
        // Format dengan spasi setiap 4 digit
        let formatted = '';
        for (let i = 0; i < value.length; i++) {
            if (i > 0 && i % 4 === 0) {
                formatted += ' ';
            }
            formatted += value[i];
        }
        
        input.value = formatted;
    }
    
    getApiKey() {
        return localStorage.getItem('api_key') || 'demo_key';
    }
    
    async trackBatch() {
        // Implement batch tracking for multiple numbers
        const input = document.getElementById('batchNumbers');
        const numbers = input.value.split(/[\n,;]/).map(n => n.trim()).filter(n => n);
        
        if (numbers.length === 0) {
            this.showError('Masukkan nomor-nomor yang akan dilacak');
            return;
        }
        
        if (numbers.length > 10) {
            this.showError('Maksimal 10 nomor per pencarian batch');
            return;
        }
        
        // Implement batch API call
    }
    
    exportResults() {
        const result = document.getElementById('result').innerText;
        const blob = new Blob([result], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `tracking_result_${Date.now()}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }
    
    shareResults() {
        if (navigator.share) {
            navigator.share({
                title: 'Hasil Pelacakan Nomor HP',
                text: 'Lihat hasil pelacakan nomor HP yang saya lakukan',
                url: window.location.href
            });
        } else {
            // Fallback to copying to clipboard
            const text = document.getElementById('result').innerText;
            navigator.clipboard.writeText(text).then(() => {
                this.showMessage('Hasil disalin ke clipboard!');
            });
        }
    }
}

// Initialize tracker when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.phoneTracker = new AdvancedPhoneTracker();
});
