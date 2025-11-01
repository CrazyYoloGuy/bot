const { createClient } = require('@supabase/supabase-js');
const config = require('../config.json');

// Initialize Supabase client with timeout
const supabase = createClient(
    config.supabaseUrl,
    config.supabaseKey,
    {
        global: {
            fetch: (...args) => {
                return Promise.race([
                    fetch(...args),
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Database request timeout')), 5000)
                    )
                ]);
            }
        }
    }
);

// Test database connection
async function testConnection() {
    try {
        const { data, error } = await supabase.from('ticket_config').select('count');
        if (error) throw error;
        console.log('✅ Database connected successfully!');
        return true;
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        if (error.message.includes('fetch failed') || error.message.includes('timeout')) {
            console.error('   → Your hosting provider may be blocking connections to Supabase');
            console.error('   → Check firewall/network settings or contact support');
        }
        throw error; // Re-throw so index.js can handle it
    }
}

// Ticket Configuration Functions
async function saveTicketConfig(guildId, categoryId, supportRoleId, reviewChannelId = null, logsChannelId = null, enableClaim = true) {
    try {
        const { data, error } = await supabase
            .from('ticket_config')
            .upsert({
                guild_id: guildId,
                category_id: categoryId,
                support_role_id: supportRoleId,
                review_channel_id: reviewChannelId,
                logs_channel_id: logsChannelId,
                enable_claim: enableClaim,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'guild_id'
            })
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error saving ticket config:', error);
        return { success: false, error: error.message };
    }
}

async function getTicketConfig(guildId) {
    try {
        const { data, error } = await supabase
            .from('ticket_config')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'No ticket configuration found for this server.' };
            }
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error getting ticket config:', error);
        return { success: false, error: error.message };
    }
}

// Ticket Functions
async function getNextTicketNumber(guildId) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select('ticket_number')
            .eq('guild_id', guildId)
            .order('ticket_number', { ascending: false })
            .limit(1);

        if (error) throw error;

        return data && data.length > 0 ? data[0].ticket_number + 1 : 1;
    } catch (error) {
        console.error('Error getting next ticket number:', error);
        return 1;
    }
}

async function createTicket(ticketData) {
    try {
        const ticketNumber = await getNextTicketNumber(ticketData.guildId);

        const { data, error } = await supabase
            .from('tickets')
            .insert({
                ticket_number: ticketNumber,
                guild_id: ticketData.guildId,
                channel_id: ticketData.channelId,
                user_id: ticketData.userId,
                username: ticketData.username,
                category: ticketData.category,
                status: 'open',
                panel_message_id: ticketData.panelMessageId || null
            })
            .select();

        if (error) throw error;

        // Log ticket creation
        await logTicketAction(data[0].id, ticketData.userId, 'created', `Ticket created in category: ${ticketData.category}`);

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error creating ticket:', error);
        return { success: false, error: error.message };
    }
}

async function getTicketByChannelId(channelId) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('channel_id', channelId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'Ticket not found.' };
            }
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error getting ticket:', error);
        return { success: false, error: error.message };
    }
}

async function getTicketsByUserId(guildId, userId) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .select('*')
            .eq('guild_id', guildId)
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error getting user tickets:', error);
        return { success: false, error: error.message };
    }
}

async function claimTicket(channelId, claimedBy) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .update({
                claimed_by: claimedBy,
                status: 'claimed'
            })
            .eq('channel_id', channelId)
            .select();

        if (error) throw error;

        // Log ticket claim
        if (data && data.length > 0) {
            await logTicketAction(data[0].id, claimedBy, 'claimed', 'Ticket claimed by staff');
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error claiming ticket:', error);
        return { success: false, error: error.message };
    }
}

async function unclaimTicket(channelId) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .update({
                claimed_by: null,
                status: 'open'
            })
            .eq('channel_id', channelId)
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error unclaiming ticket:', error);
        return { success: false, error: error.message };
    }
}

async function closeTicket(channelId, closedBy) {
    try {
        const { data, error } = await supabase
            .from('tickets')
            .update({
                status: 'closed',
                closed_at: new Date().toISOString(),
                closed_by: closedBy
            })
            .eq('channel_id', channelId)
            .select();

        if (error) throw error;

        // Log ticket closure
        if (data && data.length > 0) {
            await logTicketAction(data[0].id, closedBy, 'closed', 'Ticket closed');
        }

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error closing ticket:', error);
        return { success: false, error: error.message };
    }
}

// Ticket Messages Functions (only saves the initial panel message)
async function saveTicketMessage(ticketId, messageId) {
    try {
        const { data, error } = await supabase
            .from('ticket_messages')
            .insert({
                ticket_id: ticketId,
                message_id: messageId,
                message_type: 'panel'
            })
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error saving ticket message:', error);
        return { success: false, error: error.message };
    }
}

// Ticket Logs Functions
async function logTicketAction(ticketId, userId, action, details = null) {
    try {
        const { data, error } = await supabase
            .from('ticket_logs')
            .insert({
                ticket_id: ticketId,
                user_id: userId,
                action: action,
                details: details
            })
            .select();

        if (error) throw error;

        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error logging ticket action:', error);
        return { success: false, error: error.message };
    }
}

async function getTicketLogs(ticketId) {
    try {
        const { data, error } = await supabase
            .from('ticket_logs')
            .select('*')
            .eq('ticket_id', ticketId)
            .order('created_at', { ascending: true });

        if (error) throw error;

        return { success: true, data };
    } catch (error) {
        console.error('Error getting ticket logs:', error);
        return { success: false, error: error.message };
    }
}

// Statistics Functions
async function getTicketStats(guildId) {
    try {
        const { data: allTickets, error: allError } = await supabase
            .from('tickets')
            .select('*')
            .eq('guild_id', guildId);

        if (allError) throw allError;

        const openTickets = allTickets.filter(t => t.status === 'open').length;
        const closedTickets = allTickets.filter(t => t.status === 'closed').length;

        return {
            success: true,
            data: {
                total: allTickets.length,
                open: openTickets,
                closed: closedTickets
            }
        };
    } catch (error) {
        console.error('Error getting ticket stats:', error);
        return { success: false, error: error.message };
    }
}

// VC Support Configuration Functions
async function saveVcSupportConfig(guildId, voiceChannelId, staffPingChannelId, categoryId) {
    try {
        const { data, error } = await supabase
            .from('vc_support_config')
            .upsert({
                guild_id: guildId,
                voice_channel_id: voiceChannelId,
                staff_ping_channel_id: staffPingChannelId,
                category_id: categoryId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'guild_id'
            })
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error saving VC support config:', error);
        return { success: false, error: error.message };
    }
}

async function getVcSupportConfig(guildId) {
    try {
        const { data, error } = await supabase
            .from('vc_support_config')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'No VC support configuration found for this server.' };
            }
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        // Don't log network errors repeatedly
        if (!error.message?.includes('fetch failed')) {
            console.error('Error getting VC support config:', error.message);
        }
        return { success: false, error: error.message };
    }
}

// Welcome Configuration Functions
async function saveWelcomeConfig(guildId, channelId) {
    try {
        const { data, error } = await supabase
            .from('welcome_config')
            .upsert({
                guild_id: guildId,
                channel_id: channelId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'guild_id'
            })
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error saving welcome config:', error);
        return { success: false, error: error.message };
    }
}

async function getWelcomeConfig(guildId) {
    try {
        const { data, error } = await supabase
            .from('welcome_config')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'No welcome configuration found for this server.' };
            }
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error getting welcome config:', error);
        return { success: false, error: error.message };
    }
}

// Database Reset Function (DANGEROUS - USE WITH CAUTION)
async function resetAllDatabaseData() {
    try {
        const results = {
            ticket_logs: 0,
            ticket_messages: 0,
            tickets: 0,
            ticket_config: 0,
            vc_support_config: 0,
            welcome_config: 0
        };

        // Delete in order (respecting foreign key constraints)

        // 1. Delete ticket_logs (references tickets)
        const { error: logsError, count: logsCount } = await supabase
            .from('ticket_logs')
            .delete()
            .neq('id', 0); // Delete all rows

        if (logsError) throw logsError;
        results.ticket_logs = logsCount || 0;

        // 2. Delete ticket_messages (references tickets)
        const { error: messagesError, count: messagesCount } = await supabase
            .from('ticket_messages')
            .delete()
            .neq('id', 0);

        if (messagesError) throw messagesError;
        results.ticket_messages = messagesCount || 0;

        // 3. Delete tickets
        const { error: ticketsError, count: ticketsCount } = await supabase
            .from('tickets')
            .delete()
            .neq('id', 0);

        if (ticketsError) throw ticketsError;
        results.tickets = ticketsCount || 0;

        // 4. Delete ticket_config
        const { error: configError, count: configCount } = await supabase
            .from('ticket_config')
            .delete()
            .neq('id', 0);

        if (configError) throw configError;
        results.ticket_config = configCount || 0;

        // 5. Delete vc_support_config
        const { error: vcError, count: vcCount } = await supabase
            .from('vc_support_config')
            .delete()
            .neq('id', 0);

        if (vcError) throw vcError;
        results.vc_support_config = vcCount || 0;

        // 6. Delete welcome_config
        const { error: welcomeError, count: welcomeCount } = await supabase
            .from('welcome_config')
            .delete()
            .neq('id', 0);

        if (welcomeError) throw welcomeError;
        results.welcome_config = welcomeCount || 0;

        return { success: true, results };
    } catch (error) {
        console.error('Error resetting database:', error);
        return { success: false, error: error.message };
    }
}

// Helper function to generate ticket transcript
async function generateTicketTranscript(ticketData, messages) {
    const lines = [];

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    TICKET TRANSCRIPT                          ');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push(`Ticket Number: #${ticketData.ticket_number}`);
    lines.push(`Category: ${ticketData.category}`);
    lines.push(`Status: ${ticketData.status}`);
    lines.push(`Created By: ${ticketData.username} (${ticketData.user_id})`);
    lines.push(`Created At: ${new Date(ticketData.created_at).toLocaleString()}`);

    if (ticketData.claimed_by) {
        lines.push(`Claimed By: ${ticketData.claimed_by}`);
    }

    if (ticketData.closed_at) {
        lines.push(`Closed At: ${new Date(ticketData.closed_at).toLocaleString()}`);
        lines.push(`Closed By: ${ticketData.closed_by}`);
    }

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    CONVERSATION HISTORY                       ');
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');

    // Add messages
    for (const msg of messages) {
        const timestamp = new Date(msg.createdTimestamp).toLocaleString();
        const author = msg.author.tag;
        const content = msg.content || '[No text content]';

        lines.push(`[${timestamp}] ${author}:`);
        lines.push(content);

        // Add attachments if any
        if (msg.attachments.size > 0) {
            lines.push('  Attachments:');
            msg.attachments.forEach(att => {
                lines.push(`    - ${att.name} (${att.url})`);
            });
        }

        lines.push('');
    }

    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('                    END OF TRANSCRIPT                          ');
    lines.push('═══════════════════════════════════════════════════════════════');

    return lines.join('\n');
}

// Legit Vote Functions
async function saveLegitVote(guildId, userId, username, userAvatar, vote) {
    try {
        const { data, error } = await supabase
            .from('legit_votes')
            .upsert({
                guild_id: guildId,
                user_id: userId,
                username: username,
                user_avatar: userAvatar,
                vote: vote,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'guild_id,user_id'
            })
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error saving legit vote:', error);
        return { success: false, error: error.message };
    }
}

async function getLegitVotes(guildId) {
    try {
        const { data, error } = await supabase
            .from('legit_votes')
            .select('*')
            .eq('guild_id', guildId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting legit votes:', error);
        return { success: false, error: error.message };
    }
}

async function getLegitVoteStats(guildId) {
    try {
        const { data, error } = await supabase
            .from('legit_votes')
            .select('vote')
            .eq('guild_id', guildId);

        if (error) throw error;

        const stats = {
            total: data.length,
            yes: data.filter(v => v.vote === 'yes').length,
            no: data.filter(v => v.vote === 'no').length
        };

        return { success: true, data: stats };
    } catch (error) {
        console.error('Error getting legit vote stats:', error);
        return { success: false, error: error.message };
    }
}

async function saveLegitConfig(guildId, messageId, channelId) {
    try {
        const { data, error } = await supabase
            .from('legit_config')
            .upsert({
                guild_id: guildId,
                message_id: messageId,
                channel_id: channelId,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'guild_id'
            })
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error saving legit config:', error);
        return { success: false, error: error.message };
    }
}

async function getLegitConfig(guildId) {
    try {
        const { data, error } = await supabase
            .from('legit_config')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error) {
            if (error.code === 'PGRST116') {
                return { success: false, error: 'No legit configuration found for this server.' };
            }
            throw error;
        }

        return { success: true, data };
    } catch (error) {
        console.error('Error getting legit config:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    supabase,
    testConnection,
    saveTicketConfig,
    getTicketConfig,
    createTicket,
    getTicketByChannelId,
    getTicketsByUserId,
    claimTicket,
    unclaimTicket,
    closeTicket,
    saveTicketMessage,
    logTicketAction,
    getTicketLogs,
    getTicketStats,
    generateTicketTranscript,
    saveVcSupportConfig,
    getVcSupportConfig,
    saveWelcomeConfig,
    getWelcomeConfig,
    resetAllDatabaseData,
    saveLegitVote,
    getLegitVotes,
    getLegitVoteStats,
    saveLegitConfig,
    getLegitConfig,
    saveReactionRole,
    getReactionRoles,
    getReactionRoleByButton,
    deleteReactionRoles,
    saveApplicationConfig,
    getApplicationConfig
};

// Application System Functions
async function saveApplicationConfig(guildId, channelId, messageId, bannerUrl = null) {
    try {
        const { data, error } = await supabase
            .from('application_config')
            .upsert({
                guild_id: guildId,
                channel_id: channelId,
                message_id: messageId,
                banner_url: bannerUrl,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'guild_id'
            })
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error saving application config:', error);
        return { success: false, error: error.message };
    }
}

async function getApplicationConfig(guildId) {
    try {
        const { data, error } = await supabase
            .from('application_config')
            .select('*')
            .eq('guild_id', guildId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting application config:', error);
        return { success: false, error: error.message };
    }
}

// Reaction Roles Functions
async function saveReactionRole(guildId, messageId, buttonId, roleId, roleName, category) {
    try {
        const { data, error } = await supabase
            .from('reaction_roles')
            .upsert({
                guild_id: guildId,
                message_id: messageId,
                button_id: buttonId,
                role_id: roleId,
                role_name: roleName,
                category: category,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'guild_id,button_id'
            })
            .select();

        if (error) throw error;
        return { success: true, data: data[0] };
    } catch (error) {
        console.error('Error saving reaction role:', error);
        return { success: false, error: error.message };
    }
}

async function getReactionRoles(guildId, messageId = null) {
    try {
        let query = supabase
            .from('reaction_roles')
            .select('*')
            .eq('guild_id', guildId);

        if (messageId) {
            query = query.eq('message_id', messageId);
        }

        const { data, error } = await query;

        if (error) throw error;
        return { success: true, data: data || [] };
    } catch (error) {
        console.error('Error getting reaction roles:', error);
        return { success: false, error: error.message };
    }
}

async function getReactionRoleByButton(guildId, buttonId) {
    try {
        const { data, error } = await supabase
            .from('reaction_roles')
            .select('*')
            .eq('guild_id', guildId)
            .eq('button_id', buttonId)
            .single();

        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        console.error('Error getting reaction role by button:', error);
        return { success: false, error: error.message };
    }
}

async function deleteReactionRoles(guildId, messageId = null) {
    try {
        let query = supabase
            .from('reaction_roles')
            .delete()
            .eq('guild_id', guildId);

        if (messageId) {
            query = query.eq('message_id', messageId);
        }

        const { error } = await query;

        if (error) throw error;
        return { success: true };
    } catch (error) {
        console.error('Error deleting reaction roles:', error);
        return { success: false, error: error.message };
    }
}

