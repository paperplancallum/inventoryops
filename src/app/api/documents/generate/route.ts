import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateAndSaveDocument, type GenerateDocumentParams } from '@/lib/documents/generateDocument'

// POST /api/documents/generate
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: GenerateDocumentParams = await request.json()
    const { sourceEntityType, sourceEntityId, documentType, trigger, notes } = body

    // Validate required fields
    if (!sourceEntityType || !sourceEntityId || !documentType) {
      return NextResponse.json(
        { error: 'Missing required fields: sourceEntityType, sourceEntityId, documentType' },
        { status: 400 }
      )
    }

    // Get user info
    const { data: userInfo } = await supabase.rpc('get_current_user_info')
    const userName = userInfo?.[0]?.user_name || user.email || 'Unknown'

    // Generate and save the document using shared utility
    const document = await generateAndSaveDocument(supabase, user.id, userName, {
      sourceEntityType,
      sourceEntityId,
      documentType,
      trigger: trigger || 'manual',
      notes,
    })

    return NextResponse.json({
      success: true,
      document,
    })

  } catch (error) {
    console.error('Error generating document:', error)
    const message = error instanceof Error ? error.message : 'Internal server error'
    return NextResponse.json(
      { error: message },
      { status: 500 }
    )
  }
}
