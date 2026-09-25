type NativePdfResult = 'shared' | 'printed';

export async function shareOrPrintPdfOnNative({
  html,
  dialogTitle,
  logLabel,
  fileName,
}: {
  html: string;
  dialogTitle: string;
  logLabel: string;
  fileName: string;
}): Promise<NativePdfResult> {
  const Print = await import('expo-print');

  try {
    const { uri } = await Print.printToFileAsync({
      html,
    });
    let shareUri = uri;
    try {
      const { File, Paths } = await import('expo-file-system');
      const safeFileName = fileName.replace(/[\\/:*?"<>|]/g, '-').replace(/\.pdf$/i, '') + '.pdf';
      const namedFile = new File(Paths.cache, safeFileName);
      await new File(uri).copy(namedFile, { overwrite: true });
      shareUri = namedFile.uri;
    } catch (error) {
      console.error(`${logLabel} PDF filename setup failed`, error);
    }
    const Sharing = await import('expo-sharing');

    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(shareUri, {
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