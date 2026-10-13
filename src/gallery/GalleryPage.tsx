import { useState } from "react";
import {
  Banner,
  Body,
  Button,
  Cluster,
  Container,
  DisplayTitle,
  FeatureCard,
  Grid,
  Heading,
  Lead,
  Note,
  OutlineCard,
  PageFrame,
  PreviewFrame,
  SectionTitle,
  SegmentedControl,
  TextLink,
  airTokens,
} from "../design-system";

const swatches: Record<string, string> = {
  "page-background": "#eeede9",
  "header-background": "#19191c",
  "text-hard": "#19191c",
  "page-primary": "#6b57ff",
  "card-border": "#dddbcf",
  "feature-card-fill": "#e6e4db",
  "cloud-banner-fill": "#e5e4d9",
};

export function GalleryPage() {
  const [surface, setSurface] = useState("studio");

  return (
    <PageFrame>
      <div className="qp-system">
        <Container>
          <div className="qp-offset-64 qp-offset-sm-48">
            <p className="qp-body">Qpearance system</p>
            <DisplayTitle>Components</DisplayTitle>
            <div className="qp-offset-24">
              <Lead>
                Buttons, type, cards, and sections taken from the measured Air page. Compose them into new pages instead of copying a document.
              </Lead>
            </div>
          </div>

          <div className="qp-system__block qp-offset-64">
            <Heading>Tokens</Heading>
            <div className="qp-offset-24">
              <Grid columns={3}>
                {airTokens.map((token) => (
                  <article className="qp-card" key={token.name}>
                    <div className="qp-card__body">
                      {swatches[token.name] ? (
                        <div className="qp-swatch" style={{ background: swatches[token.name] }} />
                      ) : null}
                      <h3 className="qp-heading-3">{token.name}</h3>
                      <Body>{token.value}</Body>
                      <Body muted>{token.note}</Body>
                    </div>
                  </article>
                ))}
              </Grid>
            </div>
          </div>

          <div className="qp-system__block">
            <Heading>Type</Heading>
            <div className="qp-offset-24">
              <SectionTitle accent="Display ">title at 52px, 32px below 640</SectionTitle>
              <div className="qp-offset-24">
                <Heading>Heading at 35px / 42px / 600</Heading>
              </div>
              <div className="qp-offset-24">
                <Heading level={3}>Subheading at 20px / 28px / 600</Heading>
              </div>
              <div className="qp-offset-24">
                <Lead>Lead copy at 20px / 28px.</Lead>
              </div>
              <div className="qp-offset-8">
                <Body>Body copy at 16px / 24px.</Body>
              </div>
            </div>
          </div>

          <div className="qp-system__block">
            <Heading>Buttons and links</Heading>
            <div className="qp-offset-24">
              <Cluster>
                <Button>Rock medium</Button>
                <Button variant="outline">Outline medium</Button>
                <Button variant="clear">Clear medium</Button>
                <Button size="s">Rock small</Button>
                <Button size="s" variant="outline">
                  Outline small
                </Button>
                <TextLink href="/platform">Text link</TextLink>
              </Cluster>
            </div>
          </div>

          <div className="qp-system__block">
            <Heading>Selector</Heading>
            <div className="qp-offset-24">
              <SegmentedControl
                label="Surface"
                value={surface}
                options={[
                  { value: "studio", label: "Studio" },
                  { value: "web", label: "Web" },
                  { value: "cli", label: "CLI" },
                ]}
                onChange={setSurface}
              />
            </div>
            <div className="qp-offset-24">
              <PreviewFrame>
                <Body>Selected frame: {surface}</Body>
              </PreviewFrame>
            </div>
          </div>

          <div className="qp-system__block">
            <Heading>Cards</Heading>
            <div className="qp-offset-24">
              <Grid columns={2}>
                <OutlineCard title="Outline card">
                  Border #dddbcf, radius 8px, text padding 24px, 16px below 640.
                </OutlineCard>
                <FeatureCard title="Fill card">
                  Fill #e6e4db. Stacked above 1276, a row between 640 and 1276, stacked again on small screens.
                </FeatureCard>
              </Grid>
            </div>
            <div className="qp-offset-24">
              <Note title="Note">Fill #e5e4d9 with a 1px #dddbce border and 24px 48px padding.</Note>
            </div>
            <div className="qp-offset-24">
              <Banner title="Banner" action={<Button onDark>Action</Button>}>
                Black surface, radius 8px. Title steps from 35px to 28px at 1000px and 20px at 640px.
              </Banner>
            </div>
          </div>
        </Container>
      </div>
    </PageFrame>
  );
}
