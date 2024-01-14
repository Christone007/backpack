import { useEffect } from "react";
import {
  UI_RPC_METHOD_KEYRING_RESET,
  UI_RPC_METHOD_USER_ACCOUNT_LOGOUT,
} from "@coral-xyz/common";
import { useTranslation } from "@coral-xyz/i18n";
import { WarningIcon } from "@coral-xyz/react-common";
import { useBackgroundClient, useUser } from "@coral-xyz/recoil";
import { BpDangerButton, BpSecondaryButton, YStack } from "@coral-xyz/tamagui";
import { Box } from "@mui/material";
import { useNavigation } from "@react-navigation/native";

import { Header, HeaderIcon, SubtextParagraph } from "../../common";

export function Logout() {
  const navigation = useNavigation<any>();
  const user = useUser();
  const background = useBackgroundClient();
  const { t } = useTranslation();

  const close = () => {
    navigation.popToTop();
    navigation.popToTop();
  };

  return (
    <Warning
      buttonTitle={t("remove")}
      title={t("remove_user.title")}
      subtext={t("remove_user.subtitle")}
      onNext={async () => {
        // ph101pp todo
        await background.request({
          method: UI_RPC_METHOD_USER_ACCOUNT_LOGOUT,
          params: [user.uuid],
        });
        setTimeout(close, 250);
      }}
    />
  );
}

export function ResetWarning() {
  const background = useBackgroundClient();
  const nav = useNavigation();
  const { t } = useTranslation();

  useEffect(() => {
    nav.setOptions({ headerTitle: "Reset Backpack" });
  }, []);

  return (
    <Warning
      buttonTitle={t("reset")}
      title={t("reset_backpack")}
      subtext={t("reset_backpack_subtitle")}
      onNext={async () => {
        // ph101pp todo
        await background.request({
          method: UI_RPC_METHOD_KEYRING_RESET,
          params: [],
        });
        window.close();
      }}
    />
  );
}

function Warning({
  title,
  buttonTitle,
  subtext,
  onNext,
}: {
  title: string;
  buttonTitle: string;
  subtext: string;
  onNext: () => void;
}) {
  const { t } = useTranslation();
  const navigation = useNavigation<any>();
  const close = () => {
    navigation.popToTop();
    navigation.popToTop();
  };
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "space-between",
      }}
    >
      <Box sx={{ margin: "0 24px" }}>
        <HeaderIcon icon={<WarningIcon />} />
        <Header text={title} />
        <SubtextParagraph>{subtext}</SubtextParagraph>
      </Box>
      <YStack padding="$4" space="$3">
        <BpDangerButton label={buttonTitle} onPress={() => onNext()} />
        <BpSecondaryButton label={t("cancel")} onPress={() => close()} />
      </YStack>
    </Box>
  );
}
