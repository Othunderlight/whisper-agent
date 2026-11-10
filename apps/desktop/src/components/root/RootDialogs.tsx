import { NativeSetupDialog } from "./NativeSetupDialog";
import { PaymentDialog } from "../payment/PaymentDialog";
import { UpgradePlanDialog } from "../pricing/UpgradePlanDialog";
import { AIPostProcessingDialog } from "../settings/AIPostProcessingDialog";
import { AITranscriptionDialog } from "../settings/AITranscriptionDialog";
import { AppKeybindingsDialog } from "../settings/AppKeybindingsDialog";
import { AudioDialog } from "../settings/AudioDialog";
import { ClearLocalDataDialog } from "../settings/ClearLocalDataDialog";
import { DeleteAccountDialog } from "../settings/DeleteAccountDialog";
import { DictationLanguageDialog } from "../settings/DictationLanguageDialog";
import { DiagnosticsDialog } from "../settings/DiagnosticsDialog";
import { LicenseDialog } from "../settings/LicenseDialog";
import { MicrophoneDialog } from "../settings/MicrophoneDialog";
import { MultiDeviceDialog } from "../settings/MultiDeviceDialog";
import { MoreSettingsDialog } from "../settings/MoreSettingsDialog";
import { ProfileDialog } from "../settings/ProfileDialog";
import { ShortcutsDialog } from "../settings/ShortcutsDialog";
import { WakeWordDialog } from "../settings/WakeWordDialog";
import { ToneEditorDialog } from "../tones/ToneEditorDialog";
import { FlagTranscriptionDialog } from "../transcriptions/FlagTranscriptionDialog";
import { RetranscribeDialog } from "../transcriptions/RetranscribeDialog";

export const RootDialogs = () => {
  return (
    <>
      <RetranscribeDialog />
      <FlagTranscriptionDialog />
      <ToneEditorDialog />
      <AITranscriptionDialog />
      <AIPostProcessingDialog />
      <ProfileDialog />
      <MicrophoneDialog />
      <AudioDialog />
      <ShortcutsDialog />
      <WakeWordDialog />
      <ClearLocalDataDialog />
      <UpgradePlanDialog />
      <PaymentDialog />
      <DeleteAccountDialog />
      <MoreSettingsDialog />
      <MultiDeviceDialog />
      <DictationLanguageDialog />
      <AppKeybindingsDialog />
      <LicenseDialog />
      <DiagnosticsDialog />
      <NativeSetupDialog />
    </>
  );
};
