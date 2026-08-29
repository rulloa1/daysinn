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
  checkIn?: string
  checkOut?: string
  roomType?: string
  guests?: number
  confirmationCode?: string
}

const Email = ({
  guestName,
  checkIn,
  checkOut,
  roomType,
  guests,
  confirmationCode,
}: Props) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your Days Inn Wildwood stay is confirmed</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={header}>
          <Text style={brand}>DAYS INN WILDWOOD</Text>
        </Section>
        <Heading style={heading}>See you soon</Heading>
        <Text style={text}>
          {guestName ? `Hi ${guestName},` : 'Hi there,'} thanks for booking with
          us. Here are your stay details.
        </Text>
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
          Check-in opens at 3:00 PM. Scan the QR code at the front desk to
          activate your room tools on your phone.
        </Text>
        <Hr style={hr} />
        <Text style={footer}>Days Inn Wildwood · Guest Services</Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: Email,
  subject: 'Your stay at Days Inn Wildwood is confirmed',
  displayName: 'Booking acknowledgement',
  previewData: {
    guestName: 'Jordan',
    checkIn: 'Fri, Sep 4, 2026',
    checkOut: 'Sun, Sep 6, 2026',
    roomType: 'Queen · Ocean side',
    guests: 2,
    confirmationCode: 'DIW-83920',
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
