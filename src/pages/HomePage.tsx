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
  Lead,
  Note,
  OutlineCard,
  PageFrame,
  PreviewFrame,
  Section,
  SectionTitle,
  SegmentedControl,
  TextLink,
} from "../design-system";

const surfaces = [
  {
    value: "studio",
    label: "Studio",
    title: "Review every change in place",
    body: "Keep sessions, diffs, and comments next to the files you already work in.",
  },
  {
    value: "web",
    label: "Web",
    title: "Pick up from any browser",
    body: "The same session is waiting when you change machines. Nothing stays stuck on one laptop.",
  },
  {
    value: "cli",
    label: "CLI",
    title: "Bring the terminal with you",
    body: "Run the agents you already use, then send the result back into the shared session.",
  },
  {
    value: "mobile",
    label: "Mobile",
    title: "Check in between desks",
    body: "Read the thread, approve a change, and leave the long run on the cloud.",
  },
];

export function HomePage() {
  const [surface, setSurface] = useState("studio");
  const active = surfaces.find((item) => item.value === surface) ?? surfaces[0];

  return (
    <PageFrame
      announce={
        <a href="#start">Qpearance is open for early teams. Fair use applies.</a>
      }
    >
      <Section>
        <Container>
          <div className="qp-offset-64 qp-offset-sm-48">
            <DisplayTitle accent="Qpearance ">is one system for shipping work with agents</DisplayTitle>
            <div className="qp-offset-24">
              <Lead>
                Works with the agents you already run, and any you connect yourself.
              </Lead>
            </div>
            <div className="qp-offset-24">
              <Cluster>
                <Button href="/platform">Try Qpearance</Button>
                <TextLink href="/platform">Read more</TextLink>
              </Cluster>
            </div>
          </div>
        </Container>
      </Section>

      <Section id="surfaces">
        <Container>
          <SegmentedControl
            label="Choose where you work:"
            value={surface}
            options={surfaces.map(({ value, label }) => ({ value, label }))}
            onChange={setSurface}
          />
          <div className="qp-offset-24">
            <PreviewFrame>
              <p className="qp-heading-3">{active.title}</p>
              <div className="qp-offset-8">
                <p className="qp-body">{active.body}</p>
              </div>
            </PreviewFrame>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionTitle>Switch screens without a second thought</SectionTitle>
          <div className="qp-offset-24">
            <Note title="Cloud runs stay with the work">
              Agents run away from one machine, so a session can move from the studio to the browser without starting over.
            </Note>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionTitle accent="Qpearance ">in the tools you already use</SectionTitle>
          <div className="qp-offset-24">
            <Grid columns={2}>
              <OutlineCard title="Track parallel work">
                Keep several projects open, each with its own sessions, unread updates, and outgoing changes.
              </OutlineCard>
              <OutlineCard title="Connect an agent">
                Find a compatible agent on the machine and connect it, or add one from the registry.
              </OutlineCard>
              <OutlineCard title="Review in context">
                Open a diff from the session, check it with the tools you trust, and comment on a line.
              </OutlineCard>
              <OutlineCard title="Flexible access">
                Bring a subscription or a key, or use managed access. Switch providers without leaving the session.
              </OutlineCard>
            </Grid>
          </div>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionTitle>Bring the team onto the same session</SectionTitle>
          <div className="qp-offset-24">
            <Grid columns={2}>
              <FeatureCard title="Shared projects">
                Invite people into a project and run agent tasks in a dedicated environment.
              </FeatureCard>
              <FeatureCard title="Repeatable work">
                Hand code review, notes, and small fixes to an automation instead of a checklist.
              </FeatureCard>
            </Grid>
          </div>
        </Container>
      </Section>

      <Section id="start">
        <Container>
          <Banner
            title="Start with the access you already have"
            action={
              <Button href="/platform" onDark>
                Get access
              </Button>
            }
          >
            Use managed access, or bring the subscription and keys your team already pays for.
          </Banner>
        </Container>
      </Section>

      <Section>
        <Container>
          <SectionTitle>Try it today</SectionTitle>
          <div className="qp-offset-24">
            <Body>Three ways in. Same session underneath.</Body>
          </div>
          <div className="qp-offset-24">
            <Grid columns={3}>
              <OutlineCard title="In the studio">
                Install the plugin and run agents beside the editor.
              </OutlineCard>
              <OutlineCard title="In the browser">
                Open a session from any machine and share it with the team.
              </OutlineCard>
              <OutlineCard title="From the command line">
                Keep terminal agents in the same history as everyone else.
              </OutlineCard>
            </Grid>
          </div>
        </Container>
      </Section>
    </PageFrame>
  );
}
