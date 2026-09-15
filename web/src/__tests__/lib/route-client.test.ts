import {createRouteHandlerClient} from '@/lib/supabase/route-client'
import {createRouteHandlerClient as legacy} from '@supabase/auth-helpers-nextjs'
import {fetchInterno} from '@/lib/supabase/fetch-interno'
jest.mock('@supabase/auth-helpers-nextjs',()=>({createRouteHandlerClient:jest.fn(()=>({auth:{}}))}))
jest.mock('next/headers',()=>({cookies:jest.fn()}))
test('resolve cookies antes de criar cliente e preserva escrita e transporte interno',async()=>{
 const store={get:jest.fn(),set:jest.fn()};
 await createRouteHandlerClient({cookies:async()=>store as any});
 const [context,options]=(legacy as jest.Mock).mock.calls[0];
 expect(context.cookies()).toBe(store);expect(options.options.global.fetch).toBe(fetchInterno);
 context.cookies().set('session','value');expect(store.set).toHaveBeenCalledWith('session','value');
})
