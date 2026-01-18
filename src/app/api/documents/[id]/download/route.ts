import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/documents/[id]/download
// Get a signed URL for downloading the document
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const supabase = await createClient()

    // Verify authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get document to find storage path and name
    const { data: document, error: fetchError } = await supabase
      .from('generated_documents')
      .select('storage_path, document_name')
      .eq('id', id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Create signed URL (valid for 1 hour)
    const { data: signedUrl, error: signError } = await supabase.storage
      .from('generated-documents')
      .createSignedUrl(document.storage_path, 3600, {
        download: document.document_name,
      })

    if (signError || !signedUrl) {
      console.error('Signed URL error:', signError)
      return NextResponse.json(
        { error: 'Failed to generate download URL' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      url: signedUrl.signedUrl,
      fileName: document.document_name,
      expiresIn: 3600,
    })

  } catch (error) {
    console.error('Error generating download URL:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
