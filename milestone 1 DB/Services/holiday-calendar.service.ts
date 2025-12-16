import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { HolidayCalendar, HolidayCalendarDocument } from '../Models/HolidayCalendar';

@Injectable()
export class HolidayCalendarService {
  constructor(
    @InjectModel(HolidayCalendar.name) private holidayCalendarModel: Model<HolidayCalendarDocument>,
  ) {}
}

