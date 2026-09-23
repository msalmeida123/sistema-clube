export function consume(scope:string,identifier:string,max?:number,windowMs?:number,redis?:unknown):Promise<{allowed:boolean;retryAfter:number}>;
