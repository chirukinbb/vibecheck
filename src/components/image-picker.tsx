import * as ImageManipulator from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import {setStatusBarStyle} from 'expo-status-bar';
import {type ReactNode, useState} from 'react';
import {Modal, Pressable, StyleSheet, Text, View} from 'react-native';
import {Button, useTheme} from 'react-native-paper';

interface ImagePickerProps {
  aspect: [number, number];
  onImageSelected: (uri: string) => void;
  title?: string;
  maxWidth?: number;
  quality?: number;
  children: (props: { open: () => void }) => ReactNode;
}

export default function ImagePickerWithCrop({
                                              aspect,
                                              onImageSelected,
                                              title = 'Выберите изображение',
                                              maxWidth = 1200,
                                              quality = 0.8,
                                              children,
                                            }: ImagePickerProps) {
  const theme = useTheme();
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  const closeModal = () => setVisible(false);
  const openModal = () => setVisible(true);

  const processResult = async (result: ImagePicker.ImagePickerResult) => {
    if (result.canceled || !result.assets?.length) {
      return;
    }

    const imageUri = result.assets[0].uri;
    try {
      setLoading(true);
      const processed = await ImageManipulator.manipulateAsync(
          imageUri,
          [{resize: {width: maxWidth}}],
          {compress: quality, format: ImageManipulator.SaveFormat.WEBP},
      );
      onImageSelected(processed.uri);
    } catch (e) {
      console.warn('ImagePickerWithCrop error:', e);
    } finally {
      setLoading(false);
      closeModal();
    }
  };

  const pickFromGallery = async () => {
    closeModal();
    try {
      // Force status bar icons to light while native cropper UI is shown
      setStatusBarStyle('light');

      const anyPicker = ImagePicker as any;
      const mediaEnum = anyPicker.MediaType ?? anyPicker.MediaTypeOptions ?? anyPicker.MediaTypes ?? undefined;
      const mediaTypes = mediaEnum ? (mediaEnum.Images ?? mediaEnum.IMAGE ?? mediaEnum.All ?? mediaEnum.ALL ?? mediaEnum) : undefined;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes,
        allowsEditing: true,
        aspect,
        quality,
      });
      await processResult(result);
    } catch (e) {
      console.warn('Gallery pick error:', e);
    } finally {
      // Restore status bar style according to current app theme
      setStatusBarStyle(theme.dark ? 'light' : 'dark');
    }
  };

  const takePhoto = async () => {
    closeModal();
    try {
      // Force status bar icons to light while native cropper UI is shown
      setStatusBarStyle('light');

      const anyPicker = ImagePicker as any;
      const mediaEnum = anyPicker.MediaType ?? anyPicker.MediaTypeOptions ?? anyPicker.MediaTypes ?? undefined;
      const mediaTypes = mediaEnum ? (mediaEnum.Images ?? mediaEnum.IMAGE ?? mediaEnum.All ?? mediaEnum.ALL ?? mediaEnum) : undefined;
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes,
        allowsEditing: true,
        aspect,
        quality,
      });
      await processResult(result);
    } catch (e) {
      console.warn('Camera pick error:', e);
    } finally {
      // Restore status bar style according to current app theme
      setStatusBarStyle(theme.dark ? 'light' : 'dark');
    }
  };

  // Backwards-compatible mediaTypes selection for different expo-image-picker versions.
  // If the newer `MediaType` enum is present, Expo will accept it; otherwise fall back
  // to legacy `MediaTypeOptions`. We return the enum object itself so both forms work.

  return (
      <>
        {children({open: openModal})}

        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={closeModal}
        >
          <Pressable style={styles.overlay} onPress={closeModal}>
            <Pressable style={[styles.sheet, {backgroundColor: theme.colors.surface}]} onPress={() => {
            }}>
              <View style={styles.handle}/>
              <Text style={[styles.title, {color: theme.colors.onSurface}]}>{title}</Text>
              <Button
                  mode="contained"
                  onPress={pickFromGallery}
                  style={styles.button}
                  icon="image"
                  loading={loading}
              >
                Галерея
              </Button>
              <Button
                  mode="contained"
                  onPress={takePhoto}
                  style={styles.button}
                  icon="camera"
                  loading={loading}
              >
                Камера
              </Button>
              <Button mode="text" onPress={closeModal} style={styles.closeButton}>
                Отмена
              </Button>
            </Pressable>
          </Pressable>
        </Modal>
      </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  sheet: {
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#ccc',
    alignSelf: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  button: {
    marginBottom: 10,
  },
  closeButton: {
    alignSelf: 'flex-end',
  },
});
