import { Box, Text } from "@chakra-ui/react";
import { useRef } from "react";
import Draggable from "react-draggable";

export const DraggableText: React.FC<{
	text: { content: string; x: number; y: number };
	fontSize: number;
	isDraggable: boolean;
	onDrag?: (e: any, data: any) => void;
	dataTestId: string;
}> = ({ text, fontSize, isDraggable = true, onDrag, dataTestId }) => {
	const nodeRef = useRef(null);

	return (
		<Draggable
			disabled={!isDraggable}
			position={{ x: text.x, y: text.y }}
			onDrag={onDrag}
			bounds="parent"
			nodeRef={nodeRef} >
			<Text
				position="absolute"
				fontSize={fontSize}
				color="white"
				fontFamily="Impact"
				fontWeight="bold"
				userSelect="none"
				textTransform="uppercase"
				style={{ WebkitTextStroke: "1px black", cursor: isDraggable ? "move" : "default" }}
				ref={nodeRef}
				data-testid={dataTestId}
			>
				{text.content}
			</Text>
		</Draggable>
	);

};