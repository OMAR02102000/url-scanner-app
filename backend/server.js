// 🔧 DEBUG: kamata sababu yoyote ya process kuondoka kimya kimya
process.on('exit', (code) => {
    console.log(`🛑 PROCESS INAONDOKA! Exit code: ${code}`);
});
process.on('uncaughtException', (err) => {
    console.log(`💥 UNCAUGHT EXCEPTION: ${err.message}`);
    console.log(err.stack);
});
process.on('unhandledRejection', (reason) => {
    console.log(`💥 UNHANDLED REJECTION: ${reason}`);
});

const express = require('express');
const app = express();
const https = require('https');
const whois = require('whois-json');
const cors = require('cors');               // ✅ ONGEZA: package ya CORS

// 🔧 DEBUG: chapisha kila ombi linalofika kwenye server (method + URL + origin)
app.use((req, res, next) => {
    console.log(`📥 OMBI LIMEFIKA: ${req.method} ${req.url} | Origin: ${req.headers.origin || 'N/A'}`);
    next();
});

app.use(cors());                             // ✅ ONGEZA: ruhusu maombi kutoka origin nyingine
app.use(express.json());

app.get('/', (req, res) => {
    res.json({ message: '✅ URL Scanner API', status: 'online' });
});

// 🔥 SSL CHECK
function checkSSL(domain) {
    return new Promise((resolve) => {
        const options = {
            hostname: domain,
            port: 443,
            method: 'HEAD',
            timeout: 5000
        };

        const req = https.request(options, (res) => {
            const cert = res.connection.getPeerCertificate();
            if (cert && cert.valid_from) {
                resolve({
                    valid: true,
                    expiry: cert.valid_to,
                    message: '✅ SSL ni halali'
                });
            } else {
                resolve({
                    valid: false,
                    message: '⚠️ Hakuna SSL'
                });
            }
        });

        req.on('error', () => {
            resolve({
                valid: false,
                message: '❌ SSL haijapatikana'
            });
        });

        req.on('timeout', () => {
            req.destroy();
            resolve({
                valid: false,
                message: '⏰ Timeout'
            });
        });

        req.end();
    });
}

// 🔥 IP CHECK
function checkIPInURL(url) {
    const ipRegex = /\b(?:[0-9]{1,3}\.){3}[0-9]{1,3}\b/;
    if (ipRegex.test(url)) {
        return {
            isIP: true,
            message: '⚠️ URL ina IP address',
            risk: '+15 points'
        };
    }
    return {
        isIP: false,
        message: '✅ URL ina domain name'
    };
}

// 🔥 TYPOSQUAT CHECK
function checkTyposquat(domain) {
    const brands = [
        'google', 'facebook', 'youtube', 'twitter', 'instagram',
        'whatsapp', 'microsoft', 'apple', 'amazon', 'netflix',
        'crdb', 'nmb', 'mpesa', 'vodacom', 'ttcl', 'tigo',
        'airtel', 'halotel', 'nbc', 'tbc'
    ];

    for (const brand of brands) {
        if (domain.includes(brand)) {
            if (domain === brand + '.com' || domain === brand + '.co.tz' || domain === brand + '.tz') {
                return {
                    isTyposquat: false,
                    message: '✅ Domain inaonekana halali',
                    matchedBrand: brand
                };
            } else {
                return {
                    isTyposquat: true,
                    message: `⚠️ Inafanana na "${brand}"!`,
                    matchedBrand: brand,
                    risk: '+20 points'
                };
            }
        }
    }

    return {
        isTyposquat: false,
        message: '✅ Hakuna typosquat'
    };
}

// 🔥 DOMAIN AGE CHECK (WHOIS)
async function checkDomainAge(domain) {
    try {
        const result = await whois(domain);
        
        let creationDate = result.creationDate || result['Creation Date'] || result.created;
        
        if (!creationDate) {
            return {
                age: 'unknown',
                message: '❌ Haijulikani',
                risk: '+10 points'
            };
        }

        if (typeof creationDate === 'string') {
            if (creationDate.includes(',')) {
                creationDate = creationDate.split(',')[0].trim();
            }
            creationDate = new Date(creationDate);
        }

        if (Array.isArray(creationDate)) {
            creationDate = new Date(creationDate[0]);
        }

        const now = new Date();
        const diffTime = Math.abs(now - creationDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let message = '';
        let risk = 0;

        if (diffDays < 30) {
            message = `⚠️ Domain ni mpya sana (siku ${diffDays})`;
            risk = 15;
        } else if (diffDays < 90) {
            message = `⚠️ Domain ni mpya (siku ${diffDays})`;
            risk = 10;
        } else if (diffDays < 365) {
            message = `ℹ️ Domain ina siku ${diffDays}`;
            risk = 5;
        } else {
            const years = Math.floor(diffDays / 365);
            message = `✅ Domain ina miaka ${years}`;
            risk = 0;
        }

        return {
            age: diffDays,
            message: message,
            risk: `+${risk} points`
        };
    } catch (error) {
        return {
            age: 'unknown',
            message: '❌ WHOIS haipatikani',
            risk: '+5 points (fallback)'
        };
    }
}

// 🔥 ENDPOINT YA SCAN
app.post('/scan', async (req, res) => {
    const { url } = req.body;
    
    if (!url) {
        return res.status(400).json({ error: 'URL inahitajika' });
    }

    let domain = url.replace('https://', '').replace('http://', '').split('/')[0];
    domain = domain.replace('www.', '');
    
    const [sslResult, ipResult, typosquatResult, domainAgeResult] = await Promise.all([
        checkSSL(domain),
        Promise.resolve(checkIPInURL(url)),
        Promise.resolve(checkTyposquat(domain)),
        checkDomainAge(domain)
    ]);

    let score = 0;
    let risks = [];

    if (!sslResult.valid) {
        score += 15;
        risks.push('SSL haipo');
    }

    if (ipResult.isIP) {
        score += 15;
        risks.push('IP address');
    }

    if (typosquatResult.isTyposquat) {
        score += 20;
        risks.push(`Typosquat: "${typosquatResult.matchedBrand}"`);
    }

    if (domainAgeResult.age !== 'unknown' && domainAgeResult.age < 30) {
        score += 15;
        risks.push('Domain mpya sana');
    } else if (domainAgeResult.age !== 'unknown' && domainAgeResult.age < 90) {
        score += 10;
        risks.push('Domain mpya');
    }

    let riskLevel = 'Salama';
    let emoji = '✅';
    if (score > 0 && score <= 20) {
        riskLevel = 'Tahadhari';
        emoji = '⚠️';
    }
    if (score > 20 && score <= 40) {
        riskLevel = 'Hatari';
        emoji = '🔴';
    }
    if (score > 40) {
        riskLevel = 'Hatari Sana';
        emoji = '🚨';
    }

    res.json({
        url: url,
        domain: domain,
        score: Math.min(score, 100),
        riskLevel: riskLevel,
        emoji: emoji,
        checks: {
            ssl: sslResult,
            ip: ipResult,
            typosquat: typosquatResult,
            domainAge: domainAgeResult
        },
        risks: risks,
        message: score === 0 ? '✅ URL inaonekana salama' : `${emoji} ${risks.join(', ')}`
    });
});


app.listen(3000, '0.0.0.0', () => {
    console.log('✅ Server iko http://0.0.0.0:3000');
    console.log('🔍 POST http://0.0.0.0:3000/scan');
    console.log('📡 Inasikiliza kwenye IP zote!');
});