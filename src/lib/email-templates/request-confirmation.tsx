import React from 'react'
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface Props {
  guestName?: string
  roomNumber?: string
  requestType?: string
  details?: string
  referenceId?: string
}

const Email = ({
  guestName,
  roomNumber,
  requestType,
  details,
  referenceId,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>We received your request at Days Inn Wildwood</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>DAYS INN WILDWOOD</Text>
        </Section>
        <Heading style={heading}>Your request is in</Heading>
        <Text style={text}>
          {guestName ? `Hi ${guestName},` : 'Hi there,'} our front desk team has
          received your request{roomNumber ? ` for room ${roomNumber}` : ''} and
          is on it.
        </Text>
        <Section style={card}>
          <Text style={label}>Request</Text>
          <Text style={value}>{requestType || 'Guest service request'}</Text>
          {details ? (
            <>
              <Text style={label}>Details</Text>
              <Text style={value}>{details}</Text>
            </>
          ) : null}
          {referenceId ? (
            <>
              <Text style={label}>Reference</Text>
              <Text style={value}>{referenceId}</Text>
            </>
          ) : null}
        </Section>
        <Text style={text}>
          You'll get an update as soon as a team member picks it up. Need
          something urgent? Call the front desk any time.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Days Inn Wildwood · Guest Services</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'We received your request',
  displayName: 'Guest request confirmation',
  previewData: {
    guestName: 'Jordan',
    roomNumber: '214',
    requestType: 'Extra towels',
    details: 'Two bath towels, please.',
    referenceId: 'REQ-10482',
  },
} satisfies TemplateEntry

const main = {
  backgroundColor: '#ffffff',
  fontFamily: 'Helvetica, Arial, sans-serif',
}
const container = { padding: '24px', maxWidth: '560px' }
const header = { paddingBottom: '12px' }
const brand = {
  color: '#c8952b',
  fontSize: '12px',
  letterSpacing: '2px',
  fontWeight: 700 as const,
  margin: '0',
}
const heading = { color: '#0f1f3d', fontSize: '24px', margin: '8px 0 12px' }
const text = { color: '#334155', fontSize: '15px', lineHeight: '24px' }
const card = {
  backgroundColor: '#f6f8fc',
  borderLeft: '3px solid #c8952b',
  borderRadius: '8px',
  padding: '16px 18px',
  margin: '16px 0',
}
const label = {
  color: '#64748b',
  fontSize: '11px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '8px 0 2px',
}
const value = { color: '#0f1f3d', fontSize: '15px', margin: '0' }
const hr = { borderColor: '#e2e8f0', margin: '24px 0 12px' }
const footer = { color: '#94a3b8', fontSize: '12px' }
