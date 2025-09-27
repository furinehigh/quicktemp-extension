
/* global browser */
let dltEmailId = null;
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}

let emailInputs = new Set();
const detectEmailInputs = () => {

    const inputs = [
        ...document.querySelectorAll('input[type="email"]'),
        ...document.querySelectorAll('input[name*="email" i]'),
        ...document.querySelectorAll('input[id*="email" i]'),
        ...document.querySelectorAll('input[placeholder*="email" i]'),
        ...document.querySelectorAll('inptu[class*="email" i]')
    ]

    inputs.forEach(i => emailInputs.add(i))
}
detectEmailInputs();

// dinamically added ones too
const observer = new MutationObserver(() => {
    detectEmailInputs();
});
observer.observe(document.body, { childList: true, subtree: true });

const removeEmailDropdown = () => {
    const oldBox = document.getElementById("qt-suggestions")
    if (oldBox) oldBox.remove()
}

const showEmailDropdown = (input, sugg) => {
    removeEmailDropdown();

    if (!sugg.length) return;
    const box = document.createElement("div")
    const style = window.getComputedStyle(input)

    const isDark = window.matchMedia('(prefer-color-scheme: dark)').matches
    box.id = 'qt-suggestions'
    box.style.position = "absolute"
    if (isDark) {
        box.style.background = '#000'
        box.style.color = '#fff'
        box.style.border = '1px solid #fff'
    } else {
        box.style.background = '#fff'
        box.style.color = '#000'
        box.style.border = '1px solid #000'
    }
    box.style.fontFamily = 'sans-serif'
    box.style.fontSize = '15px'
    box.style.zIndex = 2147483647 // the largest i could put 😏

    sugg.forEach(s => {
        const item = document.createElement('div')
        item.innerHTML = `
<div style="display: flex; justify-content: space-between; align-items: center; overflow: hidden;
text-overflow: ellipsis;
white-space: nowrap;
">
  <p>${s}</p>
  <img src='https://i.ibb.co/939J93dy/favicon-16x16.png' class='width: 3px;' />
</div>`
        item.style.padding = '4px 8px'
        item.style.cursor = 'pointer'
        item.style.borderBottom = '1px solid #ccc'
        
        
        item.addEventListener('mousedown', () => {
            input.value = s
            input.dispatchEvent(new Event("input", { bubbles: true }))
            removeEmailDropdown()
        })
        
        box.appendChild(item)
    })
    
    const genEmail = document.createElement('div')
    const about = document.createElement('div')
    genEmail.style.borderBottom = '1px solid #ccc'

    genEmail.innerHTML = `
        <div style='display: flex; align-items: center; padding: 4px 8px; cursor: pointer;'>
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shuffle-icon lucide-shuffle"><path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/></svg>
        <p style='margin-left: 4px;'>Gen Random Email</p>
        </div>
        `

    about.innerText = 'You can turn the suggestions off from the extensions "Additional" settings. By QuickTime'
    about.style.fontSize = '8px'

    genEmail.addEventListener('mousedown', async () => {
        input.value = await getRandomEmail()
        input.dispatchEvent(new Event('input', { bubbles: true }))
        removeEmailDropdown()
    })
    box.appendChild(genEmail)
    box.appendChild(about)
    const rect = input.getBoundingClientRect()
    box.style.top = `${rect.bottom + window.scrollY}px`
    box.style.left = `${rect.left + window.scrollX}px`
    box.style.width = `${rect.width}px`

    document.body.appendChild(box)
    input.addEventListener("blur", () => removeEmailDropdown(), { once: true })
    input.setAttribute("autocomplete", "new-password");
    input.setAttribute("autocorrect", "off");
    input.setAttribute("autocapitalize", "off");
    input.setAttribute("spellcheck", "false");

}

emailInputs.forEach(inp => {
    inp.addEventListener('focus', async () => {
        const res = await browser.runtime.sendMessage({ action: 'getEmailSuggestions' })
        if (res && res.suggestions) {
            showEmailDropdown(inp, res.suggestions)
        }
    })
})

const getRandomEmail = async () => {
    const res = await browser.runtime.sendMessage({ action: 'genRandomEmail' })
    if (res && res.tempEmail) {
        return res.tempEmail || null
    }
}

const extractVCode = (html, opts = {}) => {
    opts = {
        minDigits: 4,
        maxDigits: 8,
        minAlphaNum: 6,
        maxAlphaNum: 12,
        keywords: ['otp', 'one-time', 'one time', 'verification', 'verify', 'code', 'passcode', 'pin', 'security code', 'auth code', 'authentication'],
        windowChars: 80,
        ...opts,

    }

    const parser = new DOMParser()
    const doc = parser.parseFromString(html || '', 'text/html')
    const text = (doc.body && doc.body.innerText) ? doc.body.innerText.replace(/\u00A0/g, '') : ''
    const attrText = Array.from(doc.querySelectorAll('*'))
    .map(el => Array.from(el.attributes || []).map(a => a.value).join(' '))
    .join(' ')

    const allText = (text + '\n' + attrText).replace(/\s+/g, '')
    const numbericRegex = new RegExp(`\\b\\d{${opts.minDigits},${opts.maxDigits}}\\b`, 'g')
    const alphaNumRegex = new RegExp(`\\b[A-Za-z0-9]{${opts.minAlphaNum},${opts.maxAlphaNum}}\\b`, 'g')

    const queryCodeRegex = /[?&](?:code|otp|token|confirmation|verify|v)[=:]?([A-Zz-z0-9\-._]{4,})/gi
    const tokenLikeRegex = new RegExp(`\\b[0-9A-Za-z\\-_.]{${opts.minDigits},${opts.maxAlphaNum}}\\b`, 'g')


    const candidates = new Map()

    function pushCandidates(value, idx, src, meta = {}){
        if (!value) return;
        const key = String(value).trim()
        if(!key) return;
        
        if (!candidates.has(key)){
            candidates.set(key, {token: key, positions: [], sources: new Set(), score: 0, meta: {}})
        }
        const entry = candidates.get(key)
        entry.positions.push(idx || -1)
        entry.sources.add(src || 'text')
        Object.assign(entry.meta, meta || {})

    }

    let m;
    while ((m = queryCodeRegex.exec(allText))){
        pushCandidates(m[1], m.index, 'url_query', {reason: 'in_url_query'})
    }

    const raw = allText
    while ((m = numbericRegex.exec(raw))){
        pushCandidates(m[0], m.index, 'numeric')

    }

    while ((m=alphaNumRegex.exec(raw))){
        pushCandidates(m[0], m.index, 'aplhanum')
    }

    while ((m=tokenLikeRegex.exec(raw))) {
        pushCandidates(m[0], m.index, 'token_like')
    }

}