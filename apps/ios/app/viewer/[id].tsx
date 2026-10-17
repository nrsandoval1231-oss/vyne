import { useLocalSearchParams, router } from "expo-router";
import { ScrollView, View, useWindowDimensions } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Image } from "expo-image";
import { photos } from "../../src/data/demo";
import { images } from "../../src/data/images";
import { c, IconButton, Body } from "../../src/components/ui";
export default function Viewer() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const photo = photos.find((p) => p.id === id);
  const { width, height } = useWindowDimensions();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: c.ink }}>
      <View style={{ padding: 16 }}>
        <IconButton
          name="x"
          label="Close photo viewer"
          onPress={() => router.back()}
        />
      </View>
      {photo ? (
        <ScrollView
          maximumZoomScale={4}
          minimumZoomScale={1}
          centerContent
          contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}
        >
          <Image
            source={images[photo.assetKey]}
            contentFit="contain"
            accessibilityLabel={photo.title}
            style={{ width, height: height - 180 }}
          />
        </ScrollView>
      ) : (
        <Body>Photo unavailable</Body>
      )}
    </SafeAreaView>
  );
}
