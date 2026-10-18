import { NextResponse } from 'next/server';

type ActionCenterUser = { studentProfileId: string | null } | null;

export async function postActionCenterResponse(
  getUser: () => Promise<ActionCenterUser>,
  generateActions: (studentProfileId: string) => Promise<unknown>,
) {
  const user = await getUser();
  if (!user?.studentProfileId) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: 401 });
  }

  try {
    return NextResponse.json({ actions: await generateActions(user.studentProfileId) });
  } catch (error) {
    console.error('Unable to generate actions:', error);
    return NextResponse.json({ error: 'Unable to generate actions.' }, { status: 500 });
  }
}
