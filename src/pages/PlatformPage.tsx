import {
  Body,
  Button,
  Cluster,
  Container,
  Grid,
  Heading,
  Lead,
  OutlineCard,
  PageFrame,
  Section,
  SectionTitle,
} from "../design-system";

export function PlatformPage() {
  return (
    <PageFrame>
      <Section id="contact">
        <Container>
          <div className="qp-offset-64 qp-offset-sm-48">
            <SectionTitle>One platform, three entry points</SectionTitle>
            <div className="qp-offset-24">
              <Lead>
                The same cards, buttons, and section rhythm as the home page, composed for a different story.
              </Lead>
            </div>
            <div className="qp-offset-24">
              <Cluster>
                <Button href="/">Back to product</Button>
                <Button href="/system" variant="outline">
                  View the system
                </Button>
              </Cluster>
            </div>
          </div>
        </Container>
      </Section>
      <Section>
        <Container>
          <Heading>What teams set up once</Heading>
          <div className="qp-offset-24">
            <Grid columns={3}>
              <OutlineCard title="Access">
                Choose managed models or connect the providers you already have.
              </OutlineCard>
              <OutlineCard title="Projects">
                Give each project its own environment, secrets, and members.
              </OutlineCard>
              <OutlineCard title="Review">
                Keep diffs and comments attached to the session that made them.
              </OutlineCard>
            </Grid>
          </div>
          <div className="qp-offset-24">
            <Body muted>
              This page does not introduce a second visual language. It only reuses the system.
            </Body>
          </div>
        </Container>
      </Section>
    </PageFrame>
  );
}
