type NativePdfResult = 'shared' | 'printed';

export async function shareOrPrintPdfOnNative({
  html,
  dialogTitle,
  logLabel,
}: {
  html: string;
  dialogTitle: string;
  logLabel: string;
}): Promise<NativePdfResult> {
  const Print = await import('expo-print');

  try {
    const { uri } = await Print.printToFileAsync({
      html,
    });
    const Sharing = await import('expo-sharing');

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri, {
        mimeType: 'application/pdf',
        dialogTitle,
      });
      return 'shared';
    }
  } catch (error) {
    console.error(`${logLabel} PDF share failed`, error);
  }

  // Android devices without a working share target can still use the
  // system print dialog and choose “Save as PDF”.
  await Print.printAsync({
    html,
    orientation: 'landscape',
  });
  return 'printed';
}