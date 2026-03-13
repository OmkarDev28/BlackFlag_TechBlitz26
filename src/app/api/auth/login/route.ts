import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import * as bcrypt from 'bcryptjs'
import { login } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: 'Username and password required' }, { status: 400 })
    }

    const trimmedUsername = username.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: trimmedUsername },
    })

    if (!user) {
      console.log('Login attempt failed: User not found:', trimmedUsername);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password comparison result for user:', trimmedUsername, 'is:', isPasswordValid);
    if (!isPasswordValid) {
      console.log('Login attempt failed: Invalid password for user:', trimmedUsername);
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
    }

    console.log('Login successful for user:', username);
    await login({ 
      id: user.id, 
      username: user.username, 
      role: user.role, 
      name: user.name, 
      clinicId: user.clinicId,
      clinicName: user.clinicName
    })

    return NextResponse.json({ 
      user: { 
        id: user.id, 
        username: user.username, 
        role: user.role, 
        name: user.name, 
        clinicId: user.clinicId,
        clinicName: user.clinicName
      } 
    })
  } catch (error) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 })
  }
}
