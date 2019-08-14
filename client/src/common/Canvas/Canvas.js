import React, { Component } from 'react'
import Box from './Box'
import Nobs from './Nobs'
import TouchTargets from './TouchTargets'

import styles from './Canvas.module.css'

export const MOVE = 'move'
export const BOX = 'box'

export default class App extends Component {
  // TODO: We can replace everything here with globels except for `box` and `size`.
  state = {
    size: { imageWidth: 0, imageHeight: 0 },
    dragging: false,
    move: [0, 0],
    box: undefined
  }

  canvasRef = React.createRef()

  componentDidMount() {
    window.addEventListener('resize', this.handleWindowResize)
    document.addEventListener('mouseup', this.handleDragEnd)
    document.addEventListener('mousemove', this.handleMouseMove)
    document.addEventListener('touchend', this.handleDragEnd)
    document.addEventListener('touchmove', this.handleMouseMove)
  }

  componentWillUnmount() {
    window.removeEventListener('resize', this.handleWindowResize)
    document.removeEventListener('mouseup', this.handleDragEnd)
    document.removeEventListener('mousemove', this.handleMouseMove)
    document.removeEventListener('touchend', this.handleDragEnd)
    document.removeEventListener('touchmove', this.handleMouseMove)
  }

  handleCanvasDragStart = e => {
    const { mode, onBoxStarted } = this.props
    const { size } = this.state

    // Start drag if it was a left click.
    if (e.button && e.button !== 0) {
      return
    }

    if (mode !== BOX) {
      return
    }

    const { imageWidth, imageHeight } = size

    e = (() => {
      if (e.clientX && e.clientY) {
        return e
      }
      return e.touches[0]
    })()

    // bug fix for mobile safari thinking there is a scroll.
    const rect = this.canvasRef.current.getBoundingClientRect()
    const mX = (e.clientX - rect.left) / imageWidth
    const mY = (e.clientY - rect.top) / imageHeight

    const box = {
      x: Math.min(1, Math.max(0, mX)),
      y: Math.min(1, Math.max(0, mY)),
      x2: Math.min(1, Math.max(0, mX)),
      y2: Math.min(1, Math.max(0, mY))
    }

    onBoxStarted(box)

    this.setState({
      canvasRect: rect,
      dragging: true,
      move: [1, 1],
      box: box
    })
  }

  // TODO: This method is used for the move tool.
  handleMouseDown = (e, index) => {
    const { mode } = this.props

    // Start drag if it was a left click.
    if (e.button && e.button !== 0) {
      return
    }

    if (mode !== MOVE) {
      return
    }

    // bug fix for mobile safari thinking there is a scroll.
    const rect = this.canvasRef.current.getBoundingClientRect()

    const id = e.target.id
    const move = [0, 0]
    if (id.startsWith('0')) {
      move[0] = 0
    } else {
      move[0] = 1
    }
    if (id.endsWith('0')) {
      move[1] = 0
    } else {
      move[1] = 1
    }

    this.setState({
      canvasRect: rect,
      dragging: true,
      move: move,
      box: index
    })
  }

  handleMouseMove = e => {
    const { onBoxChanged } = this.props
    const { canvasRect, dragging, move, box, size } = this.state

    if (!dragging) {
      return
    }

    const { x, y, x2, y2, ...rest } = box
    const { imageWidth, imageHeight } = size

    e = (() => {
      if (e.clientX && e.clientY) {
        return e
      }
      return e.touches[0]
    })()

    const rect = canvasRect
    const mX = (e.clientX - rect.left) / imageWidth
    const mY = (e.clientY - rect.top) / imageHeight

    let newX
    let newY
    let newX2
    let newY2

    if (move[0] === 0) {
      newX = mX
      newX2 = x2
    } else {
      newX = x
      newX2 = mX
    }

    if (move[1] === 0) {
      newY = mY
      newY2 = y2
    } else {
      newY = y
      newY2 = mY
    }

    const computedBox = {
      x: Math.min(1, Math.max(0, newX)),
      y: Math.min(1, Math.max(0, newY)),
      x2: Math.min(1, Math.max(0, newX2)),
      y2: Math.min(1, Math.max(0, newY2)),
      ...rest
    }

    onBoxChanged(computedBox)

    this.setState({
      box: computedBox
    })
  }

  handleDragEnd = () => {
    const { onBoxFinished } = this.props
    const { dragging, box } = this.state

    if (!dragging) {
      return
    }

    const { x, y, x2, y2, ...rest } = box

    onBoxFinished({
      x: Math.min(x, x2),
      y: Math.min(y, y2),
      x2: Math.max(x, x2),
      y2: Math.max(y, y2),
      ...rest
    })
    this.setState({ dragging: false, box: undefined })
  }

  handleWindowResize = () => {
    this.setState({
      size: {
        imageWidth: this.canvasRef.current.clientWidth,
        imageHeight: this.canvasRef.current.clientHeight
      }
    })
  }

  handleOnImageLoad = e => {
    this.setState({
      size: {
        imageWidth: e.target.clientWidth,
        imageHeight: e.target.clientHeight
      }
    })
  }

  render() {
    const { hovered, bboxes, mode, image } = this.props
    const { box, size } = this.state
    const boxesWithTemp = box ? [box, ...bboxes] : bboxes

    return (
      <div
        draggable={false}
        onMouseDown={this.handleCanvasDragStart}
        onTouchStart={this.handleCanvasDragStart}
        className={styles.wrapper}
      >
        <img
          className={styles.image}
          alt=""
          draggable={false}
          src={image}
          onLoad={this.handleOnImageLoad}
          ref={this.canvasRef}
          onDragStart={e => {
            e.preventDefault()
          }}
        />

        <div
          className={styles.blendMode}
          style={{
            width: size.imageWidth,
            height: size.imageHeight
          }}
        >
          {boxesWithTemp.map((bbox, i) => (
            <div>
              <Box key={i} index={i} bbox={bbox} imageSize={size} />
              {mode === MOVE && (
                <Nobs key={i} index={i} bbox={bbox} imageSize={size} />
              )}
            </div>
          ))}
        </div>

        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: size.imageWidth,
            height: size.imageHeight
          }}
        >
          {mode === BOX &&
            boxesWithTemp.map((bbox, i) => (
              <Box
                key={i}
                index={i}
                bbox={bbox}
                hovered={JSON.stringify(hovered) === JSON.stringify(bbox)}
                mode={BOX}
                imageSize={size}
              />
            ))}
          {mode === MOVE &&
            boxesWithTemp.map((bbox, i) => (
              <TouchTargets
                key={i}
                index={i}
                bbox={bbox}
                onCornerGrabbed={this.handleMouseDown}
                imageSize={size}
              />
            ))}
        </div>
      </div>
    )
  }
}
