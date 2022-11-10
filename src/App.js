import React, { useRef, useEffect, useState, useMemo } from "react";
import "./App.css";
import styled from "styled-components";
import { motion, useAnimation, AnimatePresence } from "framer-motion";
import uuid from "uuid";
import _ from "lodash";

const BlockContainer = styled(motion.div)`
  width: 100%;
  height: 88px;
  background-color: ${(props) => (props.active ? "black" : "white")};
  box-shadow: 0 0 0 1px rgb(17 20 24 / 15%);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: transform 0.2s cubic-bezier(0.4, 1, 0.75, 0.9),
    box-shadow 0.2s cubic-bezier(0.4, 1, 0.75, 0.9),
    -webkit-transform 0.2s cubic-bezier(0.4, 1, 0.75, 0.9),
    -webkit-box-shadow 0.2s cubic-bezier(0.4, 1, 0.75, 0.9);
  border-radius: 2px;
  cursor: grab;

  :hover {
    box-shadow: 0 0 0 1px rgb(17 20 24 / 10%), 0 2px 4px rgb(17 20 24 / 20%),
      0 8px 24px rgb(17 20 24 / 20%);
  }
`;

const Button = styled.div`
  position: fixed;
  right: 64px;
  bottom: 64px;
`;

const StackContainer = styled.div`
  width: 100%;
  height: 48px;
`;

function lerp(a, b, t) {
  return (1 - t) * a + t * b;
}

const Divider = styled.div`
  width: 100%;
  height: 5px;
  background-color: ${(props) => (props.active ? "#2B95D6" : "transparent")};
  transition: background-color 0.2s ease;
`;

const Stack = ({ children, blocks: blockIds = [] }) => {
  const [blockIdMap, setBlockIdMap] = useState({});
  const [blockOrder, setBlockOrder] = useState([]);

  const [draggingBlock, setDraggingBlock] = useState({ key: null });
  const [activeDivider, setActiveDivider] = useState({ key: null, index: -1 });

  useEffect(() => {
    const blockIdMap = {};

    for (let i = 0; i < blockIds.length; i++) {
      blockIdMap[blockIds[i]] = { ref: React.createRef() };
    }

    setBlockIdMap(blockIdMap);
    setBlockOrder(blockIds);
  }, [blockIds]);

  function onChildDragEnd(childId) {
    return function (blockAnimation) {
      return function (e) {
        blockAnimation.start({ x: 0, y: 0 });
        blockAnimation.set({cursor: "grab"})

        if (activeDivider.key !== null) {
          const before = blockOrder
            .slice(0, activeDivider.index + 1)
            .filter((key) => key !== draggingBlock);

          const after = blockOrder
            .slice(activeDivider.index + 1)
            .filter((key) => key !== draggingBlock);

          console.log([...before, draggingBlock, ...after], activeDivider);

          setBlockOrder([...before, draggingBlock, ...after]);
          setDraggingBlock({ key: null });
          setActiveDivider({ key: null, index: -1 });
        }
      };
    };
  }

  function onChildDragStart(childId) {
    return function (blockAnimation) {
      return function (e) {
        blockAnimation.set({cursor: "grabbing"})
        console.log(childId);
        setDraggingBlock(childId);
      };
    };
  }

  function onChildDrag(childId) {
    return function (e) {
      const positionsWithCurrent = blockOrder
        .filter((key) => !!blockIdMap[key].ref)
        .map((key, index) => [
          key,
          blockIdMap[key].ref.current.getBoundingClientRect(),
          index,
        ]);

      const positions = positionsWithCurrent.filter(([id]) => id !== childId);

      const mouseY = e.pageY;

      const [key, rect, ogIndex] =
        positions.find(
          ([, rect]) => lerp(rect.top, rect.bottom, 0.5) > mouseY
        ) || _.last(positions);

      const prevIndex = Math.max(0, ogIndex - 1);
      const [prevKey] = positionsWithCurrent[prevIndex];

      const midY = lerp(rect.top, rect.bottom, 0.5);
      const isTop = mouseY < midY;

      if (isTop) {
        setActiveDivider(
          prevKey === childId
            ? { key: null, index: -1 }
            : { key: prevKey, index: prevIndex }
        );
      } else {
        setActiveDivider({ key, index: ogIndex });
      }
    };
  }

  return (
    <StackContainer>
      <AnimatePresence>
        {blockOrder.map((key) => {
          return (
            <motion.div key={key} positionTransition>
              <Block
                innerRef={blockIdMap[key].ref}
                onDrag={onChildDrag(key)}
                onDragEnd={onChildDragEnd(key)}
                onDragStart={onChildDragStart(key)}
              />
              <Divider active={key === activeDivider.key} />
            </motion.div>
          );
        })}
      </AnimatePresence>
    </StackContainer>
  );
};

const Block = ({
  innerRef: ref,
  onDrag,
  onDragEnd,
  onDragStart,
  val,
  active,
}) => {
  const blockAnimation = useAnimation();

  return (
    <BlockContainer
      active={active}
      ref={ref}
      onDrag={onDrag}
      animate={blockAnimation}
      onDragEnd={onDragEnd(blockAnimation)}
      onDragStart={onDragStart(blockAnimation)}
      drag
      dragMomentum={false}
    >
      {val}
    </BlockContainer>
  );
};

function App() {
  return (
    <div className="App">
      <Stack blocks={[uuid(), uuid(), uuid(), uuid(), uuid()]} />
    </div>
  );
}

export default App;
