import { get } from 'lodash'

export const KEY_BACKSPACE = 46
export const KEY_DELETE = 8
export const KEY_Y = 89
export const KEY_Z = 90
export const KEY_SPACE = 32
export const KEY_ESCAPE = 27

const RE_NBSP = new RegExp(String.fromCharCode(160), "g");

export const replaceNbsp = (text) => {
    return text
    return text.replace(RE_NBSP, " ");
}

export const chainFuncs = (...funcs) => {
    const execFuncs = funcs.filter(f => typeof f === 'function')
    return (...args) => {
        execFuncs.forEach(execFunc => {
            execFunc.apply(this, args)
        })
    }
}

export const getParentByType = (node, type) => {
    let target = node
    while (target !== null) {
        if (get(target, 'dataset.type') === type) {
            return target
        }
        target = get(target, 'parentNode', null)
    }
}

export const removeChildren = (node) => {
    while (node.firstChild) {
        node.removeChild(node.firstChild)
    }
    return node
}

export const getCaretPosition = (node) => {
    let nodeOffset = 0
    let currentNode = null
    const selection = window.getSelection()
    const { focusNode, focusOffset } = selection
    nodeOffset += focusOffset
    currentNode = focusNode
    while (currentNode !== node && currentNode !== null) {
        const previousSiblingNode = currentNode.previousSibling
        if (previousSiblingNode) {
            nodeOffset += previousSiblingNode.textContent.length || 0
            currentNode = previousSiblingNode
        }
        else {
            currentNode = currentNode.parentNode
        }
    }
    return nodeOffset
}

export const setCaretPosition = (node, target) => {
    let currentNode = node.firstChild
    let nodeOffset = 0
    while (nodeOffset < target && currentNode !== null) {
        // target is not into this node (next sibling)
        if (nodeOffset + currentNode.textContent.length < target) {
            nodeOffset += currentNode.textContent.length
            currentNode = currentNode.nextSibling
        }
        // target is inside the node
        // should return the text node
        else if (currentNode.nodeType !== Node.TEXT_NODE) {
            currentNode = currentNode.firstChild
        }
        else {
            nodeOffset += currentNode.length
        }

    }
    const offset = target - (nodeOffset - currentNode.length)
    const range = document.createRange()
    range.setStart(currentNode, offset)
    range.setEnd(currentNode, offset)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)
}

