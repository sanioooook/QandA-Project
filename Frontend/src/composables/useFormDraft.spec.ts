import { afterEach, describe, expect, it } from 'vitest';
import { nextTick, reactive } from 'vue';
import { useFormDraft } from './useFormDraft';

const KEY = 'qanda.test.draft';

describe('useFormDraft', () => {
  afterEach(() => sessionStorage.clear());

  it('keeps edits and restores them in a new form', async () => {
    const first = reactive({ title: '', options: ['', ''] });
    useFormDraft(() => KEY, first).start();
    first.title = 'Lunch?';
    await nextTick();

    const second = reactive({ title: '', options: ['', ''] });
    const draft = useFormDraft(() => KEY, second);
    draft.start();

    expect(second.title).toBe('Lunch?');
    expect(draft.restored.value).toBe(true);
  });

  it('does not keep a form that is back to its initial state', async () => {
    const form = reactive({ title: '' });
    useFormDraft(() => KEY, form).start();
    form.title = 'typed';
    await nextTick();
    form.title = '';
    await nextTick();

    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('a fresh form restores nothing and clear removes the draft', async () => {
    const form = reactive({ title: '' });
    const draft = useFormDraft(() => KEY, form);
    draft.start();
    expect(draft.restored.value).toBe(false);

    form.title = 'x';
    await nextTick();
    draft.clear();

    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('a stored draft equal to the initial form is dropped, not announced', () => {
    sessionStorage.setItem(KEY, JSON.stringify({ title: '' }));
    const draft = useFormDraft(() => KEY, reactive({ title: '' }));

    draft.start();

    expect(draft.restored.value).toBe(false);
    expect(sessionStorage.getItem(KEY)).toBeNull();
  });

  it('ignores a corrupt draft', () => {
    sessionStorage.setItem(KEY, '{not json');
    const form = reactive({ title: 'initial' });
    const draft = useFormDraft(() => KEY, form);

    draft.start();

    expect(form.title).toBe('initial');
    expect(draft.restored.value).toBe(false);
  });
});
