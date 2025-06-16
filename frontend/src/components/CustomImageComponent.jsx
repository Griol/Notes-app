import React, { useRef, useState } from 'react';
import { NodeViewWrapper } from '@tiptap/react';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';

const MIN_WIDTH = 50;
const MAX_WIDTH = 800;

export default function CustomImageComponent({ node, updateAttributes, selected, getPos, editor }) {
  const imgRef = useRef();
  const [showHandle, setShowHandle] = useState(false);

  const startResize = (e) => {
    e.preventDefault();
    e.stopPropagation(); // Не даём drag начинаться с ручки
    const startX = e.clientX;
    const startWidth = imgRef.current.offsetWidth;

    const onMouseMove = (moveEvent) => {
      const newWidth = Math.max(
        MIN_WIDTH,
        Math.min(MAX_WIDTH, startWidth + (moveEvent.clientX - startX))
      );
      updateAttributes({ width: newWidth });
    };

    const onMouseUp = () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
  };

  // Workaround: удалять исходный node после drag-and-drop
  const handleDragEnd = (e) => {
    // getPos() - позиция node в документе
    // Если node был перемещён, после drop он дублируется, удаляем исходный
    setTimeout(() => {
      // Проверяем, есть ли node по старой позиции
      const pos = getPos && getPos();
      if (typeof pos === 'number') {
        const { state, view } = editor;
        const nodeAtPos = state.doc.nodeAt(pos);
        if (nodeAtPos && nodeAtPos.attrs.src === node.attrs.src) {
          // Удаляем node по позиции
          view.dispatch(
            state.tr.delete(pos, pos + nodeAtPos.nodeSize)
          );
        }
      }
    }, 100);
  };

  return (
    <NodeViewWrapper
      as="span"
      style={{ display: 'inline-block', position: 'relative' }}
      onMouseEnter={() => setShowHandle(true)}
      onMouseLeave={() => setShowHandle(false)}
    >
      {/* Drag handle */}
      <span
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          width: 20,
          height: 20,
          cursor: 'grab',
          zIndex: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(255,255,255,0.7)',
          borderRadius: 4,
        }}
        draggable={true}
        onDragEnd={handleDragEnd}
        title="Перетащить"
      >
        <DragIndicatorIcon fontSize="small" />
      </span>
      <img
        ref={imgRef}
        src={node.attrs.src}
        alt={node.attrs.alt}
        style={{
          width: node.attrs.width || 200,
          height: node.attrs.height || 'auto',
          maxWidth: '100%',
          border: selected ? '2px solid #6366f1' : 'none',
          cursor: 'grab',
        }}
        draggable={true}
        onDragEnd={handleDragEnd}
      />
      {selected && showHandle && (
        <span
          style={{
            position: 'absolute',
            right: 0,
            bottom: 0,
            width: 12,
            height: 12,
            background: '#6366f1',
            borderRadius: '50%',
            cursor: 'ew-resize',
            zIndex: 10,
          }}
          onMouseDown={startResize}
        />
      )}
    </NodeViewWrapper>
  );
} 