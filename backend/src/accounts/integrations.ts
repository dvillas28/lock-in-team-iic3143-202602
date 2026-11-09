import {Injectable} from "@nestjs/common";
import {createAvatarStorage} from "./providers/avatar-storage";
import {createInvitationMailer} from "./providers/mailer";
import {activationOrigins} from "./providers/config";

@Injectable()
export class AccountIntegrations {
 readonly avatars=createAvatarStorage();
 readonly mailer=createInvitationMailer();
 readonly origins=activationOrigins();
 capabilities() {return {avatar:this.avatars.available,invitationEmail:this.mailer.available};}
}
