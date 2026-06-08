// Event mutations — event write operations.
// Fetch operations live in eventSlice (fetchEvents).

import { gql } from './api';
import { AppThunk } from '../store';
import { addEvent, updateEvent as updateEventInStore, removeEvent, addUnitToEvent, removeUnitFromEvent } from '../slices/eventSlice';
import { Event } from '../types';

export const createEvent = (input: {
  name: string; shortName: string; venue?: string;
  eventDate: string; scope: string; modelsNeeded: number; color: string;
  unitIds?: number[];
}): AppThunk => async (dispatch) => {
  const { createEvent: raw } = await gql<{ createEvent: Event & { eventUnits: { unitId: number }[] } }>(`
    mutation CreateEvent($input: CreateEventInput!) {
      createEvent(input: $input) {
        id name shortName venue eventDate scope modelsNeeded color
        eventUnits { unitId }
      }
    }
  `, { input });
  dispatch(addEvent({ ...raw, unitIds: raw.eventUnits.map(eu => eu.unitId) }));
};

export const updateEvent = (input: {
  id: number; name?: string; shortName?: string; venue?: string;
  eventDate?: string; scope?: string; modelsNeeded?: number; color?: string;
}): AppThunk => async (dispatch) => {
  const { updateEvent: event } = await gql<{ updateEvent: Event | null }>(`
    mutation UpdateEvent($input: UpdateEventInput!) {
      updateEvent(input: $input) {
        id name shortName venue eventDate scope modelsNeeded color
      }
    }
  `, { input });
  if (event) dispatch(updateEventInStore(event));
};

export const deleteEvent = (id: number): AppThunk => async (dispatch) => {
  await gql(`mutation { deleteEvent(id: ${id}) }`);
  dispatch(removeEvent(id));
};

export const addEventUnit = (eventId: number, unitId: number): AppThunk => async (dispatch) => {
  await gql(`
    mutation AddEventUnit($eventId: Long!, $unitId: Long!) {
      addEventUnit(eventId: $eventId, unitId: $unitId) { id }
    }
  `, { eventId, unitId });
  dispatch(addUnitToEvent({ eventId, unitId }));
};

export const removeEventUnit = (eventId: number, unitId: number): AppThunk => async (dispatch) => {
  await gql(`
    mutation RemoveEventUnit($eventId: Long!, $unitId: Long!) {
      removeEventUnit(eventId: $eventId, unitId: $unitId)
    }
  `, { eventId, unitId });
  dispatch(removeUnitFromEvent({ eventId, unitId }));
};
