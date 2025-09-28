
/* global browser */
let dltEmailId = null;
if (typeof browser === "undefined") {
    /* global chrome */
    var browser = chrome;
}

let emailInputs = new Set();
const detectEmailInputs = () => {

    const selectors = [
        'input[type="email"]',
        'input[name*="email" i]',
        'input[id*="email" i]',
        'input[placeholder*="email" i]',
        'input[class*="email" i]'
    ]


    const inputs = selectors.map(s => [...document.querySelectorAll(s)]).flat();
    emailInputs = Array.from(new Set(inputs));

    emailInputs.forEach(inp => {
        inp.addEventListener('focus', async () => {
            const res = await browser.runtime.sendMessage({ action: 'getEmailSuggestions' })
            if (res && res.suggestions) {
                showEmailDropdown(inp, res.suggestions)
            }
        })
    })
}
detectEmailInputs()

// dinamically added ones too
const observer = new MutationObserver(() => {
    detectEmailInputs()
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
  <img src='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADEElEQVQ4T6WTa0hTcRjGz/9sZ2c7u3lPUylTm5IaZUlSGKmoS0c3DAqsDPVLGYFaQRf2KSssP5iaGIR3WoWaqGBG91RcWurUubzkdM45nTq3s53jzj+VhEAIoffjy/v8eF7e9wHIfxbYrL4kQ0m4BzoJTuYEGP7WbArwTg7Z6p/qFEmApOKIHCxvAJxpn94ySqLBtAUBuB46eAYWLZynHE5LizBYAAcJteg6ijMmkmXpsJvEOE5QtLsEVZ3P9ZkFyQrIavda6MWti51sraWXbUQQTM8w/CUaeJMkFcXzFy2NYFmuEbMR6r7JeGpBAHDgImWjXHj3vacMyHU6okwjeCtYNBv4juWC9uPbWtct5l82SI19WC0htFfcbPBMX+1fOfYjzWFmywhcKNqf2h4L5LNQVN8/U+nBwi9MjJlKCAxv6kz2epZ5a9zf0i38wJvnbJWEkHd4GP3ZJQiOltc1pp+OSX745etMVWF4QBIomYPi4j5j1fco9yRZg46Y0Jnvu1itOofa+xSlI8J9TBgippeht/PCpx3RM0fP5ey2qBSQ86BC05SYEhgP8k3QqbzHWNV92D1x1WJGiRIbokTPp0Y9D6BGjsjNAPj+9KIm3M8Sn/l0++jqjGIFUFM91Mw+uzMO5P6ad34xTFZ3RXtJ5RCiL69WZqGatt6eiMKWXSZ9E6bnHjroNh/TNVS5z8k5lmpWRJYqlRC7dm+gMSokOOEPwF7jb/RI1NqHbgMKWNouBuZFFhkiB0aw1jBgSfuY51stl6s4jUrbYxYfG0yNDi0obdHUJYUGytZWeKKaeyVeoJQkZdf2nthWiEAE8SmabBCZ4UD/Dd+c9ausQhQqRwEXwCnACCNlIX5SkLFi57V5dli4BNWE1VbmBhgbFIsM+mlrto+NLh7/RvoiNIMgthUM40BYCIoZ5ohsHt+uGa8Nil975YTWkbBhLbmXJinowmX0Yk9xVAgPFne/GYsbGYYoZaURhFp5MBRFcQRlcQGHkQS5NdU/CtVuyMKljgHXyTmbsE66Z2wzQdtUmP4F+g3IFWr7gaBrNwAAAABJRU5ErkJggg==' class='width: 3px;' />
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

    about.innerText = 'You can turn these suggestions off from the extension&#39;s "Additional" settings. By QuickTime'
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

const getRandomEmail = async () => {
    const res = await browser.runtime.sendMessage({ action: 'genRandomEmail' })
    if (res && res.tempEmail) {
        return res.tempEmail || null
    }
}

// verification and otp stuffs
let otpInputs = [];

const detectOtpInputs = () => {
    const selectors = [
        'input[autocomplete="one-time-code"]',
        'input[name*="otp" i]',
        'input[id*="otp" i]',
        'input[placeholder*="otp" i]',
        'input[name*="code" i]',
        'input[id*="code" i]',
        'input[placeholder*="code" i]',
        'input[name*="verify" i]',
        'input[id*="verify" i]',
        'input[placeholder*="verify" i]',
        'input[name*="pin" i]',
        'input[id*="pin" i]',
        'input[placeholder*="pin" i]'
    ];

    const inputs = selectors.map(s => [...document.querySelectorAll(s)]).flat();
    otpInputs = Array.from(new Set(inputs));

    otpInputs.forEach(inp => {
        console.log('goinging through all')
        if (!inp.dataset.qtBound) {
            inp.dataset.qtBound = "1"; // avoid rebinding
            inp.addEventListener("focus", async () => {
                console.log('otp input focuesed')
                const res = await browser.runtime.sendMessage({ action: "getOtpSuggestion" });
                if (res && res.otp) {
                    showOtpDropdown(inp, res.otp);
                }
            });
        }
    });

};

const removeOtpDropdown = () => {
    const oldBox = document.getElementById("qt-otp");
    if (oldBox) oldBox.remove();
};

const showOtpDropdown = (input, otp) => {
    removeOtpDropdown();
    if (!otp) return;

    const box = document.createElement("div");
    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

    box.id = "qt-otp";
    box.style.position = "absolute";
    box.style.background = isDark ? "#000" : "#fff";
    box.style.color = isDark ? "#fff" : "#000";
    box.style.border = `1px solid ${isDark ? "#fff" : "#000"}`;
    box.style.fontFamily = "sans-serif";
    box.style.fontSize = "15px";
    box.style.zIndex = 2147483647;

    const item = document.createElement("div");
    item.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center;">
      <span>${otp}</span>
      <div style="display: flex; align-items: center;">
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAADEElEQVQ4T6WTa0hTcRjGz/9sZ2c7u3lPUylTm5IaZUlSGKmoS0c3DAqsDPVLGYFaQRf2KSssP5iaGIR3WoWaqGBG91RcWurUubzkdM45nTq3s53jzj+VhEAIoffjy/v8eF7e9wHIfxbYrL4kQ0m4BzoJTuYEGP7WbArwTg7Z6p/qFEmApOKIHCxvAJxpn94ySqLBtAUBuB46eAYWLZynHE5LizBYAAcJteg6ijMmkmXpsJvEOE5QtLsEVZ3P9ZkFyQrIavda6MWti51sraWXbUQQTM8w/CUaeJMkFcXzFy2NYFmuEbMR6r7JeGpBAHDgImWjXHj3vacMyHU6okwjeCtYNBv4juWC9uPbWtct5l82SI19WC0htFfcbPBMX+1fOfYjzWFmywhcKNqf2h4L5LNQVN8/U+nBwi9MjJlKCAxv6kz2epZ5a9zf0i38wJvnbJWEkHd4GP3ZJQiOltc1pp+OSX745etMVWF4QBIomYPi4j5j1fco9yRZg46Y0Jnvu1itOofa+xSlI8J9TBgippeht/PCpx3RM0fP5ey2qBSQ86BC05SYEhgP8k3QqbzHWNV92D1x1WJGiRIbokTPp0Y9D6BGjsjNAPj+9KIm3M8Sn/l0++jqjGIFUFM91Mw+uzMO5P6ad34xTFZ3RXtJ5RCiL69WZqGatt6eiMKWXSZ9E6bnHjroNh/TNVS5z8k5lmpWRJYqlRC7dm+gMSokOOEPwF7jb/RI1NqHbgMKWNouBuZFFhkiB0aw1jBgSfuY51stl6s4jUrbYxYfG0yNDi0obdHUJYUGytZWeKKaeyVeoJQkZdf2nthWiEAE8SmabBCZ4UD/Dd+c9ausQhQqRwEXwCnACCNlIX5SkLFi57V5dli4BNWE1VbmBhgbFIsM+mlrto+NLh7/RvoiNIMgthUM40BYCIoZ5ohsHt+uGa8Nil975YTWkbBhLbmXJinowmX0Yk9xVAgPFne/GYsbGYYoZaURhFp5MBRFcQRlcQGHkQS5NdU/CtVuyMKljgHXyTmbsE66Z2wzQdtUmP4F+g3IFWr7gaBrNwAAAABJRU5ErkJggg==" style="width:16px;height:16px;" />
        <span style="font-size: 10px; margin-left: 2px;">Experimental</span>
      </div>
    </div>
  `;
    item.style.padding = "4px 8px";
    item.style.cursor = "pointer";

    item.addEventListener("mousedown", () => {
        input.value = otp;
        input.dispatchEvent(new Event("input", { bubbles: true }));
        removeOtpDropdown();
    });

    box.appendChild(item);

    const about = document.createElement("div");
    about.innerText =
        `You can turn this suggestion off from the extension's "Additional" settings. By QuickTemp`;
    about.style.fontSize = "8px";
    about.style.padding = "2px 4px";
    box.appendChild(about);

    const rect = input.getBoundingClientRect();
    box.style.top = `${rect.bottom + window.scrollY}px`;
    box.style.left = `${rect.left + window.scrollX}px`;
    box.style.width = `${rect.width}px`;

    document.body.appendChild(box);

    input.addEventListener("blur", () => removeOtpDropdown(), { once: true });
    input.setAttribute("autocomplete", "off");
};

// Run once on load
detectOtpInputs();

// Watch for dynamic inputs
const otpObserver = new MutationObserver(() => detectOtpInputs());
otpObserver.observe(document.body, { childList: true, subtree: true });
