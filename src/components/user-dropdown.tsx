import {
  Menu,
  MenuButton,
  Text,
  MenuList,
  MenuItem,
  Avatar,
  Icon,
  Flex,
} from "@chakra-ui/react";
import { CaretDown, CaretUp, SignOut } from "@phosphor-icons/react";
import { useAuthentication } from "../contexts/authentication";
import { useLoggedInUser } from "../hooks/useLoggedInUser";

export const UserDropdown: React.FC = () => {
  const { state, signout } = useAuthentication();
  const { user, isLoading } = useLoggedInUser();

  if (!state.isAuthenticated || isLoading) {
    return null;
  }

  return (
    <Menu>
      {({ isOpen }) => (
        <>
          <MenuButton>
            <Flex direction="row" alignItems="center">
              <Avatar
                size="xs"
                mr={2}
                name={user?.username}
                src={user?.pictureUrl}
                border="1px solid white"
              />
              <Text color="white">
                {user?.username}
              </Text>
              <Icon color="white" ml={2} as={isOpen ? CaretUp : CaretDown} mt={1} />
            </Flex>
          </MenuButton>
          <MenuList>
            <MenuItem icon={<Icon as={SignOut} />} onClick={signout}>Sign Out</MenuItem>
          </MenuList>
        </>
      )}
    </Menu>
  );
};
