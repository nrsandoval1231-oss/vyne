import { Screen, Body, Card, Label } from "../src/components/ui";
export default function Credits() {
  return (
    <Screen back title="A borrowed glimpse.">
      <Body>
        Bundled demonstration photography from Unsplash, distributed under the
        Unsplash License (https://unsplash.com/license). Images are included
        locally; the app does not fetch them from a remote service.
      </Body>
      <Card>
        <Label>Source image identifiers</Label>
        <Body>Lake: photo-1476514525535-07fb3b4ae5f1</Body>
        <Body>Dog: photo-1517849845537-4d257902454a</Body>
        <Body>Family: photo-1511632765486-a01980e01a18</Body>
        <Body>Sports: photo-1461896836934-ffe607ba8211</Body>
        <Body>Workspace: photo-1497366754035-f200968a6e72</Body>
      </Card>
      <Body>
        The softened family preview is a derivative of the bundled family
        photograph. The sample reservation is original generated artwork with no
        real personal or booking data. All titles, dates, categories, and
        file-size estimates are fictional.
      </Body>
    </Screen>
  );
}
