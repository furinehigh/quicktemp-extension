
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
    box.style.border = style.border
    if (isDark){
        box.style.background = '#000'
        box.style.color = '#fff'
    } else {
        box.style.background = '#fff'
        box.style.color = '#000'
    }
    box.style.font = style.font
    box.style.zIndex = 9994 // btw 4 is my lucky no :)

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

        // const genEmailHTML = `
        // <div style='display: flex; justify-content: space-between; align-items: center; padding: 4px 8px;'>
        // <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shuffle-icon lucide-shuffle"><path d="m18 14 4 4-4 4"/><path d="m18 2 4 4-4 4"/><path d="M2 18h1.973a4 4 0 0 0 3.3-1.7l5.454-8.6a4 4 0 0 1 3.3-1.7H22"/><path d="M2 6h1.972a4 4 0 0 1 3.6 2.2"/><path d="M22 18h-6.041a4 4 0 0 1-3.3-1.8l-.359-.45"/></svg>
        // <p>Random email</p>
        // </div>
        // `

        item.addEventListener('mousedown', () => {
            input.value = s
            input.dispatchEvent(new Event("input", {bubbles: true}))
            removeEmailDropdown()
        })

        box.appendChild(item)
    })

    const rect = input.getBoundingClientRect()
    box.style.top = `${rect.bottom + window.scrollY}px`
    box.style.left = `${rect.left + window.scrollX}px`
    box.style.width = `${rect.width}px`

    document.body.appendChild(box)
    input.addEventListener("blur", () => removeEmailDropdown(), {once: true})

}

emailInputs.forEach(inp => {
    inp.addEventListener('focus', async () => {
        const res = await browser.runtime.sendMessage({action: 'getEmailSuggestions'})
        if (res && res.suggestions){
            showEmailDropdown(inp, res.suggestions)
        }
    })
})