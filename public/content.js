
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

const removeDropdown = () => {
    const oldBox = document.getElementById("qt-suggestions")
    if (oldBox) oldBox.remove()
}

const showDropdown = (input, sugg) => {
    removeDropdown();

    if (!sugg.length) return;
    const box = document.createElement("div")
    box.id = 'qt-suggestions'
    box.style.position = "absolute"
    box.style.border = "1px solid #ccc"
    box.style.background = "#fff"
    box.style.zIndex = 9994 // btw 4 is my lucky no :)

    sugg.forEach(s => {
        const item = document.createElement('div')
        item.textContent = s
        item.style.padding = '4px 8px'
        item.style.cursor = 'pointer'


        item.addEventListener('mousedown', () => {
            input.value = s
            input.dispatchEvent(new Event("input", {bubbles: true}))
            removeDropdown()
        })

        box.appendChild(item)
    })

    const rect = input.getBoundingClientRect()
    box.style.top = `${rect.bottom + window.scrollY}px`
    box.style.left = `${rect.left + window.scrollX}px`
    box.style.width = `${rect.width}px`

    document.body.appendChild(box)
    input.addEventListener("blur", () => removeDropdown(), {once: true})

}

emailInputs.forEach(inp => {
    inp.addEventListener('focus', async () => {
        const res = await browser.runtime.sendMessage({action: 'getEmailSuggestions'})
        if (res && res.suggestions){
            showDropdown(inp, res.suggestions)
        }
    })
})