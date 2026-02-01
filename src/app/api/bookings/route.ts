import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function GET() {
  try {
    const supabase = await createClient();

    // TODO: Query bookings from Supabase
    // const { data, error } = await supabase
    //   .from('bookings')
    //   .select('*')
    //   .order('created_at', { ascending: false });

    // if (error) throw error;

    // Placeholder response
    return NextResponse.json({
      bookings: [],
      message: 'TODO: Implement Supabase query for bookings',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch bookings' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // TODO: Validate booking data
    // TODO: Insert booking into Supabase
    // const { data, error } = await supabase
    //   .from('bookings')
    //   .insert([
    //     {
    //       user_id: body.userId,
    //       service_type: body.serviceType,
    //       scheduled_date: body.scheduledDate,
    //       address: body.address,
    //       status: 'requested',
    //     },
    //   ])
    //   .select();

    // if (error) throw error;

    // Placeholder response
    return NextResponse.json({
      success: false,
      message:
        'TODO: Implement booking creation with Supabase and payment intent',
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create booking' },
      { status: 500 }
    );
  }
}
