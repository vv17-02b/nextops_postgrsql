import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; 
import { auth } from "@/lib/auth"; 
import { Prisma, Plan, User } from "@prisma/client"; 

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function PUT(req: NextRequest): Promise<Response> {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json(
        { success: false, error: "Unauthorized. No active session email found." },
        { status: 401 },
      );
    }

    const bodyData = await req.json().catch(() => ({}));
    const { name, image } = bodyData;

    const targetName: string = typeof name === "string" && name.trim().length >= 2 
      ? name.trim() 
      : (session.user.name || "Developer");
      
    const targetImage: string | null = typeof image === "string" && image.trim() !== "" 
      ? image.trim() 
      : null;

    console.log(` [ NextOps Pipeline ]: Синхронізація профілю для ${session.user.email}...`);
    
    const existingUser: User | null = await prisma.user.findUnique({
      where: { email: session.user.email }
    });

    let updatedUser: User;

    if (!existingUser) {
      console.log(` [ MongoDB Atlas ]: Користувача не знайдено в кластері. Авто-ініціалізація ноди...`);
      
      const createData: Prisma.UserCreateInput = {
        email: session.user.email,
        name: targetName,
        image: targetImage,
        role: session.user.role || "DEVELOPER",
        plan: (session.user.plan === "PRO" ? Plan.PRO : session.user.plan === "ENTERPRISE" ? Plan.ENTERPRISE : Plan.FREE)
      };

      updatedUser = await prisma.user.create({
        data: createData
      });
    } else {
      console.log(` [ MongoDB Atlas ]: Ноду знайдено. Виконується безпосередня мутація документів...`);
      
      const updateData: Prisma.UserUpdateInput = {
        name: targetName,
        image: targetImage
      };

      updatedUser = await prisma.user.update({
        where: { email: session.user.email },
        data: updateData
      });
    }

    const finalFormattedUser = {
      id: updatedUser.id,
      name: updatedUser.name,
      image: updatedUser.image || "/images/incognita.jpg", 
      plan: updatedUser.plan || "FREE",
    };

    return NextResponse.json(
      {
        success: true,
        message: "Профіль успішно синхронізовано з MongoDB Atlas",
        user: finalFormattedUser,
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    const err = error as Error;
    console.error(" [ API_USER_PROFILE_MUTATION_CRASH ]:", err.message);
    return NextResponse.json(
      {
        success: false,
        error: `Помилка сервера: ${err.message}`,
      },
      { status: 500 },
    );
  }
}
