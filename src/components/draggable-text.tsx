import { Box, Text } from "@chakra-ui/react";
import Draggable from "react-draggable";

export const DraggableText: React.FC<{
	text: { content: string; x: number; y: number };
	fontSize: number;
	isDraggable: boolean;
	onDrag?: (e: any, data: any) => void;
	dataTestId: string;
}> = ({ text, fontSize, isDraggable = true, onDrag, dataTestId }) => {
	const textElement = (
		<Text
			position="absolute"
			fontSize={fontSize}
			color="white"
			fontFamily="Impact"
			fontWeight="bold"
			userSelect="none"
			textTransform="uppercase"
			style={{ WebkitTextStroke: "1px black", cursor: isDraggable ? "move" : "default" }}
		>
			{text.content}
		</Text>
	);

	if (isDraggable) {
		return (
			<Draggable position={{ x: text.x, y: text.y }} onDrag={onDrag} bounds="parent">
				{textElement}
			</Draggable>
		);
	}

	return (
		<Box position="absolute" left={`${text.x}px`} top={`${text.y}px`} data-testid={dataTestId}>
			{textElement}
		</Box>
	);
};