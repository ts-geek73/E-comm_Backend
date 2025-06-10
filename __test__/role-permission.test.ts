import { app, closeDatabase, connect } from '../jest.setup';
import { faker } from '@faker-js/faker';
import request from 'supertest';
import { IPermission, IRole, IUser } from '../src/types';
import { Permission, Role, RolePermission, User } from '../src/models';

describe('Role Base Endpoints', () => {
    let fakeUser: IUser;
    let permissionsList: IPermission[];

    beforeAll(async () => {
        await connect();
        await User.create({
            clerkId: 'user_2to1ikz0GlZxmlEr2yz9ZSY3f2W',
            sessionId: 'sess_test123',
            userId: 'user_test456',
            name: 'Test User',
            email: 'test@example.com',
            roles_id: [],
        });
        fakeUser = await User.findOne({ userId: "user_test456" }) as IUser

        const fakePermission = await Permission.create({
            name: 'Permission Create',
            key: "permission.create",
            description: "fajdbdbjdf bn hlirth fghnhh thk"
        })

        const fakeRoleAssigPermission = await Permission.create({
            name: 'Roles Assign',
            key: "roles.assign",
            description: "fajdbdbjdf bn hlirth fghnhh thk"
        })

        const roleUpdatePermission = await Permission.create({
            name: 'Role Update',
            key: "role.update",
            description: "Permission to update roles"
        })

        const roleDeletePermission = await Permission.create({
            name: 'Role Delete',
            key: "role.delete",
            description: "Permission to delete roles"
        })

        const permissionUpdatePermission = await Permission.create({
            name: 'Permission Update',
            key: "permission.update",
            description: "Permission to update permissions"
        })

        const permissionDeletePermission = await Permission.create({
            name: 'Permission Delete',
            key: "permission.delete",
            description: "Permission to delete permissions"
        })

        const roleViewPermission = await Permission.create({
            name: 'Role View',
            key: "role.view",
            description: "Permission to view roles"
        })

        const permissionViewPermission = await Permission.create({
            name: 'Permission View',
            key: "permission.view",
            description: "Permission to view permissions"
        })

        const role = await Role.create({
            name: 'superadmin',
            description: 'Has all necessary permissions',
        });

        permissionsList = [
            fakePermission, fakeRoleAssigPermission, roleUpdatePermission,
            roleDeletePermission, permissionUpdatePermission, permissionDeletePermission,
            roleViewPermission, permissionViewPermission
        ];

        for (const permission of permissionsList) {
            await RolePermission.create({
                role_id: role._id,
                permission_id: permission._id
            });
        }

        await User.findOneAndUpdate(
            { userId: fakeUser.userId },
            { $set: { roles_id: [role._id] } }
        );

    })

    afterAll(async () => {
        await closeDatabase();
    });

    describe('Role Permission CRUD', () => {
        const fakeRoleData: Partial<IRole> = {
            name: faker.helpers.arrayElement(['admin', 'manager', 'editor', 'support']),
            description: faker.lorem.sentence(),
        };

        const fakePermissionData1: Partial<IPermission> = {
            name: faker.helpers.arrayElement([
                'Create Product',
                'Delete Data',
                'Update Order',
                'View Reports',
            ]),
            key: faker.helpers.arrayElement([
                'product.create',
                'data.delete',
                'order.update',
                'report.view',
            ]),
            description: faker.lorem.sentence(),
        };

        describe("Role CRUD", () => {
            it("Role Create without userid", async () => {
                const res = await request(app).post("/role-permission/roles")
                    .set('Accept', 'application/json')
                    .send({
                        name: fakeRoleData.name,
                        description: fakeRoleData.description,
                    });

                expect(res.statusCode).toBe(401);
                expect(res.body.details).toBe("Authentication required");
            })

            it("Role Create with fake userId", async () => {
                const res = await request(app).post("/role-permission/roles")
                    .set('Accept', 'application/json')
                    .send({
                        name: fakeRoleData.name,
                        description: fakeRoleData.description,
                        user_id: fakeUser.userId + "12",
                    });

                expect(res.statusCode).toBe(404);
                expect(res.body.details).toBe("User not found");
            })

            it("Role Create with userId", async () => {
                const res = await request(app).post("/role-permission/roles")
                    .set('Accept', 'application/json')
                    .send({
                        name: fakeRoleData.name,
                        description: fakeRoleData.description,
                        user_id: fakeUser.userId,
                    });

                expect(res.statusCode).toBe(201);
                expect(res.body.data).toHaveProperty("role");
            })

            it("Create role with duplicate name", async () => {
                const res = await request(app).post("/role-permission/roles")
                    .set('Accept', 'application/json')
                    .send({
                        name: 'superadmin', // Duplicate name
                        description: 'Duplicate role',
                        user_id: fakeUser.userId,
                    });

                expect(res.statusCode).toBe(400);
                expect(res.body.message).toContain('Conflict');
            });

            it("Get all roles", async () => {
                const res = await request(app).get("/role-permission/roles?page=1&limit=100")
                    .set('Accept', 'application/json');

                expect(res.statusCode).toBe(200);
                expect(res.body.data).toHaveProperty("roles");
                expect(Array.isArray(res.body.data.roles)).toBe(true);
            });

            it("Update role", async () => {
                const role = await Role.findOne({ name: fakeRoleData.name });
                const updatedData = {
                    name: "Updated Role Name",
                    description: "Updated description",
                    user_id: fakeUser.userId
                };

                const res = await request(app).put(`/role-permission/roles/${role?._id}`)
                    .set('Accept', 'application/json')
                    .send(updatedData);

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe('Role updated successfully');
            });

            it("Update non-existent role", async () => {
                const res = await request(app).put("/role-permission/roles/60f7b1b3c9b0a72b8c8b4567")
                    .set('Accept', 'application/json')
                    .send({
                        name: 'Updated Role',
                        description: 'Updated description',
                        user_id: fakeUser.userId
                    });

                expect(res.statusCode).toBe(404);
                expect(res.body.message).toContain('Role not found');
            });

            it("Delete role", async () => {
                // Create a role specifically for deletion
                const roleToDelete = await Role.create({
                    name: 'role-to-delete',
                    description: 'This role will be deleted'
                });

                const res = await request(app).delete(`/role-permission/roles/${roleToDelete._id}`)
                    .set('Accept', 'application/json')
                    .send({ user_id: fakeUser.userId });

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe('Role deleted successfully');
            });
        })

                describe("Permission CRUD", () => {
            it("Permission Create with userId", async () => {
                console.log("🚀 ~ it ~ Permission Create with userId:")

                const res = await request(app).post("/role-permission/permissions")
                    .set('Accept', 'application/json')
                    .send({
                        name: fakePermissionData1.name,
                        key: fakePermissionData1.key,
                        description: fakePermissionData1.description,
                        user_id: fakeUser.userId,
                    });

                expect(res.statusCode).toBe(201);
            })

            it("Permission Create with Fake userId", async () => {
                const res = await request(app).post("/role-permission/permissions")
                    .set('Accept', 'application/json')
                    .send({
                        name: fakePermissionData1.name,
                        key: fakePermissionData1.key,
                        description: fakePermissionData1.description,
                        user_id: fakeUser.userId + "12",
                    });

                expect(res.statusCode).toBe(404);
            })
            it("Permission Create withOut userId", async () => {
                const res = await request(app).post("/role-permission/permissions")
                    .set('Accept', 'application/json')
                    .send({
                        name: fakePermissionData1.name,
                        key: fakePermissionData1.key,
                        description: fakePermissionData1.description,
                    });

                expect(res.statusCode).toBe(401);
            })

            it("Create permission with duplicate key", async () => {
                const res = await request(app).post("/role-permission/permissions")
                    .set('Accept', 'application/json')
                    .send({
                        name: 'Duplicate Permission',
                        key: 'permission.create', // Duplicate key
                        description: 'Duplicate permission',
                        user_id: fakeUser.userId,
                    });

                expect(res.statusCode).toBe(400);
                expect(res.body.details).toContain('Conflict');
            });

            it("Get all permissions", async () => {
                const res = await request(app).get("/role-permission/permissions?page=1&limit=100")
                    .set('Accept', 'application/json');

                expect(res.statusCode).toBe(200);
                expect(res.body.data).toHaveProperty("permissions");
                expect(Array.isArray(res.body.data.permissions)).toBe(true);
            });


            it("Update permission", async () => {
                const permission = await Permission.findOne({ key: fakePermissionData1.key });
                const updatedData = {
                    name: "Updated Permission Name",
                    key: "updated.permission.key",
                    description: "Updated description",
                    user_id: fakeUser.userId
                };

                const res = await request(app).put(`/role-permission/permissions/${permission?._id}`)
                    .set('Accept', 'application/json')
                    .send(updatedData);

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe('Permission updated successfully');
            });

            it("Delete permission", async () => {
                // Create a permission specifically for deletion
                const permissionToDelete = await Permission.create({
                    name: 'Permission to Delete',
                    key: 'permission.to.delete',
                    description: 'This permission will be deleted'
                });

                const res = await request(app).delete(`/role-permission/permissions/${permissionToDelete._id}`)
                    .set('Accept', 'application/json')
                    .send({ user_id: fakeUser.userId });

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe('Permission deleted successfully');
            });

            it("Delete non-existent permission", async () => {
                const res = await request(app).delete("/role-permission/permissions/60f7b1b3c9b0a72b8c8b4567")
                    .set('Accept', 'application/json')
                    .send({ user_id: fakeUser.userId });

                expect(res.statusCode).toBe(404);
                expect(res.body.message).toContain('Permission not found');
            });
        })

        describe(" Permission -  Role", () => {
            it("Role-permission Assign with userId", async () => {
                const role = await Role.findOne({ name: 'superadmin' })
                const permission = await Permission.findOne({ key: 'permission.create' })
                const permission2 = await Permission.findOne({ key: 'roles.assign' })
                const res = await request(app).post(`/role-permission/roles/${role?._id}/permissions`)
                    .set('Accept', 'application/json')
                    .send({
                        permissionIds: [permission?._id, permission2?._id],
                        user_id: fakeUser.userId,
                    });

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe('Permissions assigned successfully');
            })

            it("Get permissions of a role", async () => {
                const role = await Role.findOne({ name: 'superadmin' });

                const res = await request(app).get(`/role-permission/roles/${role?._id}/permissions`)
                    .set('Accept', 'application/json');

                expect(res.statusCode).toBe(200);
                expect(res.body.data).toHaveProperty("permissions");
                expect(Array.isArray(res.body.data.permissions)).toBe(true);
            });

            it("Assign permission to non-existent role", async () => {
                const permission = await Permission.findOne({ key: 'permission.create' });

                const res = await request(app).post(`/role-permission/roles/60f7b1b3c9b0a72b8c8b4567/permissions`)
                    .set('Accept', 'application/json')
                    .send({
                        permissionIds: [permission?._id],
                        user_id: fakeUser.userId,
                    });

                expect(res.statusCode).toBe(404);
                expect(res.body.details).toContain('Role not found');
            });
        })

        describe("Role - User", () => {
            it("Role Assign with userId", async () => {
                const role = await Role.findOne({ name: 'superadmin' })
                const res = await request(app).post(`/role-permission/users/${fakeUser.userId}/roles`)
                    .set('Accept', 'application/json')
                    .send({
                        roleIds: [role?._id],

                    });

                expect(res.statusCode).toBe(200);
                expect(res.body.message).toBe('Roles assigned successfully');
            })

            it("Get user access details", async () => {
                const res = await request(app).get(`/role-permission/users?userId=${fakeUser.userId}`)
                    .set('Accept', 'application/json');

                expect(res.statusCode).toBe(200);
                expect(res.body.data).toHaveProperty("user");
                expect(res.body.data).toHaveProperty("permissionKeys");
            });

            it("Get all users access details", async () => {
                const res = await request(app).get("/role-permission/users")
                    .set('Accept', 'application/json');

                expect(res.statusCode).toBe(200);
                expect(res.body.data).toHaveProperty("users");
                expect(Array.isArray(res.body.data.users)).toBe(true);
            });

            it("Assign non-existent role to user", async () => {
                const res = await request(app).post(`/role-permission/users/${fakeUser.userId}/roles`)
                    .set('Accept', 'application/json')
                    .send({ roleIds: ['60f7b1b3c9b0a72b8c8b4567'] });

                expect(res.statusCode).toBe(400);
                expect(res.body.details).toContain('Some role IDs are invalid');
            });
        })



        describe("Authorization Tests", () => {
            let limitedUser: IUser;

            beforeAll(async () => {
                // Create a user with limited permissions
                const limitedUserDoc = await User.create({
                    clerkId: 'user_limited123',
                    sessionId: 'sess_limited123',
                    userId: 'user_limited456',
                    name: 'Limited User',
                    email: 'limited@example.com',
                    roles_id: [],
                });
                limitedUser = limitedUserDoc;

                // Create a role with limited permissions
                const limitedRole = await Role.create({
                    name: 'limited-role',
                    description: 'Role with limited permissions',
                });

                // Only assign view permissions
                const viewPermission = await Permission.findOne({ key: 'role.view' });
                await RolePermission.create({
                    role_id: limitedRole._id,
                    permission_id: viewPermission?._id
                });

                await User.findOneAndUpdate(
                    { userId: limitedUser.userId },
                    { $set: { roles_id: [limitedRole._id] } }
                );
            });

            it("Limited user cannot create permissions", async () => {
                const res = await request(app).post("/role-permission/permissions")
                    .set('Accept', 'application/json')
                    .send({
                        name: 'New Permission',
                        key: 'new.permission',
                        description: 'Permission created by limited user',
                        user_id: limitedUser.userId,
                    });

                expect(res.statusCode).toBe(403);
                expect(res.body.message).toBe("Permission denied.");
            });
        });
    })
})