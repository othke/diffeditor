import React from 'react'
import { forEach, isNil } from 'lodash'
import uuid from 'uuid'
import { diffWords } from 'diff'

import {
    getParentByType,
    removeChildren,
    getCaretPosition,
    setCaretPosition,
    replaceNbsp,
    chainFuncs,
    KEY_BACKSPACE,
    KEY_DELETE,
    KEY_Z,
    KEY_Y,
    KEY_SPACE,
    KEY_ESCAPE
} from './utils'

const style = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'baseline',
    height: '500px',
    margin: '100px',
    padding: '10px',
    backgroundColor: 'aliceblue',
}


export default class Editor extends React.Component {
    constructor(props) {
        super(props)
    }

    // content
    observer = null
    focusSentence = null
    shadowDOM = document.implementation.createHTMLDocument('VirtualDOM')

    // undo/redo
    stack = new Array()
    stackPosition = -1
    blocked = false

    componentDidMount = () => {
        const { value } = this.props
        this.loadInitialValue(value)
        this.observe()
    }

    /**
     * Handle Ctrl+Z Ctrl+Y
     */
    undoKeys = (e) => {
        const isRedoKey = e.ctrlKey && e.keyCode === KEY_Y
        const isUndoKey = e.ctrlKey && e.keyCode === KEY_Z
        if (!isUndoKey && !isRedoKey) {
            return
        }
        e.preventDefault()
        this.blocked = true
        if (isUndoKey) {
            this.renderEditor({ fromHistory: true, historyForward: false })
        }
        if (isRedoKey) {
            this.renderEditor({ fromHistory: true, historyForward: true })
        }
    }

    /**
     * Prevent break line
     */
    breakKeys = (e) => {
        if (e.keyCode === 13) {
            e.preventDefault()
        }
    }
    
    escapeKey = (e) => {
        console.log(e.keyCode)
    }

    preventForbidenMutation = (e) => {
        const { keyCode } = e
        const selection = window.getSelection()
        const { anchorNode, anchorOffset, focusNode, focusOffset, type } = selection
        // don't mutate different sentence node 
        if (anchorNode !== focusNode) {
            e.preventDefault()
        }
        if (keyCode === KEY_BACKSPACE || keyCode === KEY_DELETE || (keyCode === KEY_SPACE && type === 'Range')) {

        }
    }


    onPaste = (e) => {
        const data = e.clipboardData.getData('text')
        // TODO: insert paste value
        e.preventDefault()
    }

    observe = () => {
        if (isNil(this.observer)) {
            this.observer = new MutationObserver(this.onUpdate)
        }
        const config = { characterData: true, subtree: true, characterDataOldValue: true }
        this.observer.observe(this.ref, config)
    }

    disconnect = () => {
        this.observer.disconnect()
    }

    loadInitialValue = (value) => {
        // root
        const body = this.shadowDOM.body
        forEach(value, (paragraph, idParagraph) => {
            const paragraphNode = this.shadowDOM.createElement('div')
            paragraphNode.id = uuid()
            paragraphNode.dataset.type = 'paragraph'
            body.appendChild(paragraphNode)
            if (paragraph.length === 0) {
                const sentenceNode = this.shadowDOM.createElement('span')
                sentenceNode.dataset.text = undefined
                sentenceNode.innerHTML = '<br/>'
                paragraphNode.appendChild(sentenceNode)
            }
            forEach(paragraph, (sentence, idSentence) => {
                const sentenceNode = this.shadowDOM.createElement('span')
                sentenceNode.id = uuid()
                sentenceNode.dataset.type = 'sentence'
                sentenceNode.dataset.text = sentence.text
                sentenceNode.dataset.idParagraph = idParagraph
                sentenceNode.dataset.idSentence = idSentence
                sentenceNode.dataset.special = sentence.special
                sentenceNode.innerText = sentence.text || '<br/>'
                sentenceNode.style.color = sentence.special ? 'orange' : 'black'
                paragraphNode.appendChild(sentenceNode)
            })
        })
        this.renderEditor({ initialRender: true })
    }

    onUpdate = (mutations) => {
        // don't mutate when come from undo/redo keys
        if (this.blocked) {
            this.blocked = false
            return
        }
        this.disconnect()
        const mutation = mutations[0]
        const { target } = mutation
        const sentenceNode = getParentByType(target, 'sentence')
        this.diffSentence(sentenceNode)
        this.renderEditor({ fromHistory: false })
        this.observe()
    }

    diffSentence = (node) => {
        const origin = node.dataset.text
        const destination = node.innerText
        const diffs = diffWords(origin, destination)
        const addedDiffs = diffs.filter(diff => isNil(diff.removed))

        // update shadow dom
        const shadowSentenceNode = this.shadowDOM.getElementById(node.id)
        removeChildren(shadowSentenceNode)
        forEach(addedDiffs, diff => {
            const textNode = this.shadowDOM.createTextNode(replaceNbsp(diff.value))
            if (diff.added) {
                const addedNode = this.shadowDOM.createElement('font')
                addedNode.color = 'green'
                addedNode.appendChild(textNode)
                shadowSentenceNode.appendChild(addedNode)
            }
            else {
                shadowSentenceNode.appendChild(textNode)
            }
        })
        return shadowSentenceNode
    }

    renderEditor = ({ initialRender = false, fromHistory = false, historyForward = false }) => {
        // undo redo commands
        if (fromHistory) {
            // no history
            if (this.stackPosition === 0) {
                return
            }
            // redo
            if (historyForward && this.stackPosition + 1 < this.stack.length) {
                this.stackPosition += 1
                const { data, caretPosition } = this.stack[this.stackPosition]
                this.ref.innerHTML = data
                setCaretPosition(this.ref, caretPosition)
            }
            // undo
            else if (!historyForward) {
                this.stackPosition -= 1
                const { data, caretPosition } = this.stack[this.stackPosition]
                this.ref.innerHTML = data
                setCaretPosition(this.ref, caretPosition)
            }
        }
        // editing command
        else {
            const caretPosition = getCaretPosition(this.ref)
            this.ref.innerHTML = this.shadowDOM.body.innerHTML
            this.stackPosition += 1
            const state = { data: this.ref.innerHTML, caretPosition }
            this.stack[this.stackPosition] = state
            this.stack = this.stack.slice(0, this.stack.length)
            setCaretPosition(this.ref, caretPosition)
        }
    }


    render() {
        return (
            <div
                ref={el => { this.ref = el }}
                id="editor"
                contentEditable={true}
                style={style}
                onKeyDown={chainFuncs(this.undoKeys, this.breakKeys, this.escapeKey, this.preventForbidenMutation)}
                onPaste={this.onPaste}
            >
            </div>
        )
    }
}
