import './button-motion.css'

// Decorate only the label. Icons, accessible names and click targets stay in place.
export function prepareButtonMotion() {
  const rounded = '.pill-button, .nav-contact, .filter, .footer-up, .dialog-close'
  const plain = '.navigation > :not(.nav-contact), .text-link, .footer-links > :not(#motion-toggle)'
  for (const button of document.querySelectorAll(rounded + ', ' + plain)) {
    const rolls = button.matches(rounded)
    button.classList.toggle('roll-button', rolls)
    for (const node of Array.from(button.childNodes)) {
      if (node.nodeType !== Node.TEXT_NODE || !node.textContent.trim()) continue
      const label = document.createElement('span')
      label.className = rolls ? 'roll-label' : 'motion-underline'
      node.replaceWith(label)
      if (!rolls) {
        label.append(node)
        continue
      }
      const line = document.createElement('span')
      line.className = 'roll-line'
      const echo = document.createElement('span')
      echo.className = 'roll-echo'
      echo.setAttribute('aria-hidden', 'true')
      echo.dataset.copy = node.textContent.trim()
      line.append(node, echo)
      label.append(line)
    }
  }
}
