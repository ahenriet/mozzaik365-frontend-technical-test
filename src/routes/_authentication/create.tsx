import {
  Box,
  Button,
  Flex,
  Heading,
  HStack,
  Icon,
  IconButton,
  Input,
  Textarea,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { MemeEditor } from "../../components/editor/meme-editor";
import { useMemo, useState } from "react";
import { MemePictureProps } from "../../components/meme-picture";
import { Plus, Trash } from "@phosphor-icons/react";
import { useMutation } from "@tanstack/react-query";
import { createMeme } from "../../api";
import { useAuthToken } from "../../contexts/authentication";

export const Route = createFileRoute("/_authentication/create")({
  component: CreateMemePage,
});

type Picture = {
  url: string;
  file: File;
};

function CreateMemePage() {
  const [picture, setPicture] = useState<Picture | null>(null);
  const [description, setDescription] = useState<string>("");
  const [texts, setTexts] = useState<MemePictureProps["texts"]>([]);
  const token = useAuthToken();
  const toast = useToast();

  const { mutate } = useMutation({
    mutationFn: async (formData: FormData) => {
      await createMeme(token, formData);
    },
    onSuccess: () => {
      toast({
        title: "Meme created",
        description: "Your meme has been created successfully",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
      window.location.href = "/";
    },
    onError: (error: any) => {
      toast({
        title: "Error creating meme",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    },
  });

  const handleSubmit = async () => {
    if (!picture) {
      toast({
        title: "Missing picture",
        description: "Please upload a picture before submitting.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    if (!description) {
      toast({
        title: "Missing description",
        description: "Please add a description before submitting.",
        status: "warning",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("Picture", picture.file);
    formData.append("Description", description);

    texts.forEach((text, index) => {
      formData.append(`Texts[${index}][Content]`, text.content);
      formData.append(`Texts[${index}][X]`, Math.ceil(text.x).toString());
      formData.append(`Texts[${index}][Y]`, Math.ceil(text.y).toString());
    });
    mutate(formData);
  };

  const handleDrop = (file: File) => {
    setPicture({
      url: URL.createObjectURL(file),
      file,
    });
    setDescription("");
    setTexts([]);
  };

  const handleAddCaptionButtonClick = () => {
    setTexts([
      ...texts,
      {
        content: `New caption ${texts.length + 1}`,
        x: Math.random() * 400,
        y: Math.random() * 225,
      },
    ]);
  };

  const handleDeleteCaptionButtonClick = (index: number) => {
    setTexts(texts.filter((_, i) => i !== index));
  };

  const handleTextContentChange = (text: string, index: number) => {
    const newTexts = [...texts];
    newTexts[index] = {
      ...newTexts[index],
      content: text,
    };
    setTexts(newTexts);
  }

  const handleTextPositionChange = (index: number, x: number, y: number) => {
    const newTexts = [...texts];
    newTexts[index] = {
      ...newTexts[index],
      x: x,
      y: y,
    };
    setTexts(newTexts);
  }

  const memePicture = useMemo(() => {
    if (!picture) {
      return undefined;
    }

    return {
      pictureUrl: picture.url,
      texts,
      isDraggable: true,
      onTextPositionChange: handleTextPositionChange
    };
  }, [picture, texts]);

  return (
    <Flex width="full" height="full">
      <Box flexGrow={1} height="full" p={4} overflowY="auto">
        <VStack spacing={5} align="stretch">
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Upload your picture
            </Heading>
            <MemeEditor onDrop={handleDrop} memePicture={memePicture} />
          </Box>
          <Box>
            <Heading as="h2" size="md" mb={2}>
              Describe your meme
            </Heading>
            <Textarea placeholder="Type your description here..."
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </Box>
        </VStack>
      </Box>
      <Flex
        flexDir="column"
        width="30%"
        minW="250"
        height="full"
        boxShadow="lg"
      >
        <Heading as="h2" size="md" mb={2} p={4}>
          Add your captions
        </Heading>
        <Box p={4} flexGrow={1} height={0} overflowY="auto">
          <VStack>
            {texts.map((text, index) => (
              <Flex key={index} width="full">
                <Input value={text.content} mr={1} onChange={e => handleTextContentChange(e.target.value, index)} />
                <IconButton
                  onClick={() => handleDeleteCaptionButtonClick(index)}
                  aria-label="Delete caption"
                  icon={<Icon as={Trash} />}
                />
              </Flex>
            ))}
            <Button
              colorScheme="cyan"
              leftIcon={<Icon as={Plus} />}
              variant="ghost"
              size="sm"
              width="full"
              onClick={handleAddCaptionButtonClick}
              isDisabled={memePicture === undefined}
            >
              Add a caption
            </Button>
          </VStack>
        </Box>
        <HStack p={4}>
          <Button
            as={Link}
            to="/"
            colorScheme="cyan"
            variant="outline"
            size="sm"
            width="full"
          >
            Cancel
          </Button>
          <Button
            colorScheme="cyan"
            size="sm"
            width="full"
            color="white"
            isDisabled={memePicture === undefined}
            onClick={handleSubmit}
          >
            Submit
          </Button>
        </HStack>
      </Flex>
    </Flex>
  );
}
