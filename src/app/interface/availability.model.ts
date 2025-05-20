export interface TimeSlot{

  start:  string;
  end: string;
  isAvailable?: boolean;
}

export interface Availability {

  id?: string;
  date: string;
  slots: TimeSlot[];
}
