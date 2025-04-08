import { Box, useDimensions } from "@chakra-ui/react";
// useDimensions is deprecated but the recommended useSize is not intended for public usage 
// https://www.npmjs.com/package/@chakra-ui/react-use-size/v/0.0.0-dev-20220922115811?activeTab=readme
import { useMemo, useRef } from "react";
import { DraggableText } from "./draggable-text";

export type MemePictureProps = {
  pictureUrl: string;
  texts: {
    content: string;
    x: number;
    y: number;
  }[];
  dataTestId?: string;
  onTextPositionChange?: (index: number, x: number, y: number) => void;
  isDraggable?: boolean;
};

const REF_WIDTH = 800;
const REF_HEIGHT = 450;
const REF_FONT_SIZE = 36;

export const MemePicture: React.FC<MemePictureProps> = ({
  pictureUrl,
  texts: rawTexts,
  dataTestId,
  onTextPositionChange,
  isDraggable = true,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const dimensions = useDimensions(containerRef, true);
  const boxWidth = dimensions?.borderBox.width;

  const { height, fontSize, texts } = useMemo(() => {
    if (!boxWidth) {
      return { height: 0, fontSize: 0, texts: rawTexts };
    }

    return {
      height: (boxWidth / REF_WIDTH) * REF_HEIGHT,
      fontSize: (boxWidth / REF_WIDTH) * REF_FONT_SIZE,
      texts: rawTexts.map((text) => ({
        ...text,
        x: (boxWidth / REF_WIDTH) * text.x,
        y: (boxWidth / REF_WIDTH) * text.y,
      })),
    };
  }, [boxWidth, rawTexts]);

  const handleDrag = (index: number, _e: any, data: any) => {
    if (onTextPositionChange) {
      const scaledX = (data.x / boxWidth!) * REF_WIDTH;
      const scaledY = (data.y / boxWidth!) * REF_WIDTH;
      onTextPositionChange(index, scaledX, scaledY);
    }
  };

  return (
    <Box
      width="full"
      height={height}
      ref={containerRef}
      backgroundImage={pictureUrl}
      backgroundColor="gray.100"
      backgroundPosition="center"
      backgroundRepeat="no-repeat"
      backgroundSize="contain"
      overflow="hidden"
      position="relative"
      borderRadius={8}
      data-testid={dataTestId}
    >
      {texts.map((text, index) => (
        <DraggableText
          key={index}
          text={text}
          fontSize={fontSize}
          isDraggable={isDraggable}
          onDrag={(e, data) => handleDrag(index, e, data)}
          dataTestId={`${dataTestId}-text-${index}`}
        />
      ))}
    </Box>
  );
};
