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

}