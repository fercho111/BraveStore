import React from 'react'
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const Page = async () => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return (
    <div>Page</div>
  )
}

export default Page