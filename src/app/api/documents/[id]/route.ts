import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/documents/[id]
// Get document details
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

    const { data: document, error } = await supabase
      .from('generated_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    return NextResponse.json({
      document: {
        id: document.id,
        sourceEntityType: document.source_entity_type,
        sourceEntityId: document.source_entity_id,
        sourceEntityRef: document.source_entity_ref,
        documentType: document.document_type,
        documentName: document.document_name,
        generatedAt: document.created_at,
        generatedById: document.generated_by_id,
        generatedByName: document.generated_by_name,
        pdfUrl: document.file_url,
        storagePath: document.storage_path,
        fileSize: document.file_size,
        dataSnapshot: document.data_snapshot,
        generationTrigger: document.generation_trigger,
        notes: document.notes,
        brandId: document.brand_id,
      },
    })

  } catch (error) {
    console.error('Error fetching document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/documents/[id]
// Delete a document
export async function DELETE(
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

    // Get document to find storage path
    const { data: document, error: fetchError } = await supabase
      .from('generated_documents')
      .select('storage_path')
      .eq('id', id)
      .single()

    if (fetchError || !document) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 })
    }

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('generated-documents')
      .remove([document.storage_path])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      // Continue anyway - database record should still be deleted
    }

    // Delete database record
    const { error: deleteError } = await supabase
      .from('generated_documents')
      .delete()
      .eq('id', id)

    if (deleteError) {
      console.error('Database delete error:', deleteError)
      return NextResponse.json(
        { error: 'Failed to delete document' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error deleting document:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
