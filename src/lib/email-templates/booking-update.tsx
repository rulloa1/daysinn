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

export interface BookingChange {
  label: string
  from: string
  to: string
}

interface Props {
  guestName?: string
  confirmationCode?: string
  changes?: BookingChange[]
  checkIn?: string
  checkOut?: string
  roomType?: string
  guests?: number
}

const Email = ({
  guestName,
  confirmationCode,
  changes = [],
  checkIn,
  checkOut,
  roomType,
  guests,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Days Inn Wildwood reservation was updated</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>DAYS INN WILDWOOD</Text>
        </Section>
        <Heading style={heading}>Your reservation was updated</Heading>
        <Text style={text}>
          {guestName ? `Hi ${guestName},` : 'Hi there,'} the front desk updated
          your stay. Here's what changed.
        </Text>

        <Section style={card}>
          {changes.length === 0 ? (
            <Text style={value}>Your reservation details were updated.</Text>
          ) : (
            changes.map((change) => (
              <React.Fragment key={change.label}>
                <Text style={label}>{change.label}</Text>
                <Text style={value}>
                  <span style={oldValue}>{change.from || '—'}</span>
                  {'  →  '}
                  <span style={newValue}>{change.to || '—'}</span>
                </Text>
              </React.Fragment>
            ))
          )}
        </Section>

        <Text style={sectionTitle}>Current stay details</Text>
        <Section style={card}>
          <Text style={label}>Check-in</Text>
          <Text style={value}>{checkIn || 'To be confirmed'}</Text>
          <Text style={label}>Check-out</Text>
          <Text style={value}>{checkOut || 'To be confirmed'}</Text>
          <Text style={label}>Room</Text>
          <Text style={value}>{roomType || 'Standard room'}</Text>
          <Text style={label}>Guests</Text>
          <Text style={value}>{guests ?? 2}</Text>
          {confirmationCode ? (
            <>
              <Text style={label}>Confirmation</Text>
              <Text style={value}>{confirmationCode}</Text>
            </>
          ) : null}
        </Section>

        <Text style={text}>
          If anything looks wrong, reply to this email or call the front desk and
          we'll fix it right away.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Days Inn Wildwood · Guest Services</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Update to your Days Inn Wildwood reservation',
  displayName: 'Booking update notification',
  previewData: {
    guestName: 'Jordan',
    confirmationCode: 'DIW-83920',
    changes: [
      { label: 'Check-out', from: 'Sun, Sep 6, 2026', to: 'Mon, Sep 7, 2026' },
      { label: 'Guests', from: '2', to: '3' },
    ],
    checkIn: 'Fri, Sep 4, 2026',
    checkOut: 'Mon, Sep 7, 2026',
    roomType: 'Queen · Ocean side',
    guests: 3,
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
const sectionTitle = {
  color: '#0f1f3d',
  fontSize: '13px',
  fontWeight: 700 as const,
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  margin: '24px 0 0',
}
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
const oldValue = { color: '#94a3b8', textDecoration: 'line-through' }
const newValue = { color: '#0f1f3d', fontWeight: 700 as const }
const hr = { borderColor: '#e2e8f0', margin: '24px 0 12px' }
const footer = { color: '#94a3b8', fontSize: '12px' }
